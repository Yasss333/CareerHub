import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import ImageKit from '@imagekit/nodejs';
import multer from 'multer';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

let imagekit = null;
const getImageKit = () => {
  if (!imagekit && process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URL_ENDPOINT) {
    imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
    });
  }
  return imagekit;
};

const profilePhotoUpload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) {
      return callback(new Error('Choose a JPG, PNG, WEBP, or GIF image'));
    }
    callback(null, true);
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'careerhub-super-secret-jwt-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Helper functions
const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    isAlumniMentor: user.isAlumniMentor,
    mentorApprovalStatus: user.mentorApprovalStatus
  };
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || email.split('@')[0],
        role: 'USER'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isAlumniMentor: true,
        mentorApprovalStatus: true,
        createdAt: true
      }
    });
    
    // Generate token
    const token = generateToken(user);
    
    res.status(201).json({
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password, accountType } = req.body;

    if (accountType !== undefined && !['USER', 'ADMIN', 'MENTOR'].includes(accountType)) {
      return res.status(400).json({ error: 'Invalid account type' });
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (
      (accountType && user.role !== accountType) ||
      (user.role === 'MENTOR' &&
        (!user.isAlumniMentor || user.mentorApprovalStatus !== 'APPROVED'))
    ) {
      return res.status(401).json({ error: 'Invalid credentials for the selected account type' });
    }
    
    // Generate token
    const token = generateToken(user);
    
    // Return user without password
    const { passwordHash, ...userWithoutPassword } = user;
    
    res.json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isAlumniMentor: true,
        mentorApprovalStatus: true,
        image: true,
        avatar: true,
        createdAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  const decoded = verifyToken(token);
  if (!decoded?.id) return res.status(401).json({ error: 'Invalid or expired token' });
  req.userId = decoded.id;
  next();
};

router.patch('/me', authenticate, async (req, res) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const currentPassword = typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';

    if (!name || name.length > 80) return res.status(400).json({ error: 'Name must be between 1 and 80 characters' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return res.status(400).json({ error: 'Enter a valid email address' });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    if (email !== currentUser.email.toLowerCase()) {
      if (!currentPassword || !(await comparePassword(currentPassword, currentUser.passwordHash))) {
        return res.status(400).json({ error: 'Enter your current password to change your email' });
      }
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== currentUser.id) {
        return res.status(409).json({ error: 'That email is already in use' });
      }
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { name, email },
      select: {
        id: true, email: true, name: true, role: true, isAlumniMentor: true,
        mentorApprovalStatus: true, image: true, avatar: true, createdAt: true
      }
    });
    res.json({ user });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'That email is already in use' });
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.post('/me/photo', authenticate, (req, res, next) => {
  profilePhotoUpload.single('photo')(req, res, (error) => {
    if (error) return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: error.message });
    next();
  });
}, async (req, res) => {
  const configuredImageKit = getImageKit();
  if (!configuredImageKit) {
    if (req.file?.path) fs.promises.unlink(req.file.path).catch(() => {});
    return res.status(503).json({ error: 'Profile photo uploads are unavailable because ImageKit is not configured' });
  }
  if (!req.file) return res.status(400).json({ error: 'Choose a photo to upload' });

  try {
    const uploaded = await configuredImageKit.files.upload({
      file: fs.createReadStream(req.file.path),
      fileName: `profile-${req.userId}-${Date.now()}`,
      folder: 'user-profiles'
    });
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { image: uploaded.url, avatar: uploaded.url },
      select: {
        id: true, email: true, name: true, role: true, isAlumniMentor: true,
        mentorApprovalStatus: true, image: true, avatar: true, createdAt: true
      }
    });
    res.json({ user });
  } catch (error) {
    console.error('Profile photo upload error:', error);
    res.status(500).json({ error: 'Failed to upload profile photo' });
  } finally {
    fs.promises.unlink(req.file.path).catch(() => {});
  }
});

export default router;
