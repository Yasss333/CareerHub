import express from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import ImageKit from '@imagekit/nodejs';
import multer from 'multer';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'careerhub-super-secret-jwt-key-2024';

// ImageKit setup (if credentials are provided)
let imagekit = null;
if (process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URL_ENDPOINT) {
  imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
  });
}

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Get ImageKit authentication parameters (for frontend upload)
router.get('/imagekit-auth', authenticate, async (req, res) => {
  if (!imagekit) {
    return res.status(503).json({ error: 'ImageKit not configured' });
  }
  
  try {
    const authenticationParameters = imagekit.getAuthenticationParameters();
    res.json(authenticationParameters);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get ImageKit auth parameters' });
  }
});

// Get all resumes for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const resumes = await prisma.resume.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    
    // No need to parse JSON fields - PostgreSQL handles them natively
    const parsedResumes = resumes.map(resume => ({
      ...resume,
      skills: resume.skills || [],
      personalInfo: resume.personalInfo || {},
      experience: resume.experience || [],
      projects: resume.projects || [],
      education: resume.education || []
    }));
    
    res.json(parsedResumes);
  } catch (error) {
    console.error('Fetch resumes error:', error);
    res.status(500).json({ error: 'Failed to fetch resumes' });
  }
});

// Get single resume by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const resume = await prisma.resume.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    
    // No need to parse JSON fields - PostgreSQL handles them natively
    const parsedResume = {
      ...resume,
      skills: resume.skills || [],
      personalInfo: resume.personalInfo || {},
      experience: resume.experience || [],
      projects: resume.projects || [],
      education: resume.education || []
    };
    
    res.json(parsedResume);
  } catch (error) {
    console.error('Fetch resume error:', error);
    res.status(500).json({ error: 'Failed to fetch resume' });
  }
});

// Create new resume
router.post('/', authenticate, async (req, res) => {
  try {
    const resumeData = {
      userId: req.user.id,
      title: req.body.title || 'Untitled-resume',
      template: req.body.template || 'classic',
      accentColor: req.body.accentColor || '#3B82F6',
      professionSummary: req.body.professionSummary || '',
      skills: req.body.skills || [],
      personalInfo: req.body.personalInfo || {},
      experience: req.body.experience || [],
      projects: req.body.projects || [],
      education: req.body.education || [],
      profile: req.body.profile || '',
      public: req.body.public || false
    };
    
    const resume = await prisma.resume.create({
      data: resumeData
    });
    
    // No need to parse JSON fields - PostgreSQL handles them natively
    const parsedResume = {
      ...resume,
      skills: resume.skills || [],
      personalInfo: resume.personalInfo || {},
      experience: resume.experience || [],
      projects: resume.projects || [],
      education: resume.education || []
    };
    
    res.status(201).json(parsedResume);
  } catch (error) {
    console.error('Resume creation error:', error);
    res.status(500).json({ error: 'Failed to create resume' });
  }
});

// Update resume with image upload support
router.put('/:id', authenticate, upload.single('image'), async (req, res) => {
  try {
    const resume = await prisma.resume.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    
    let resumeData = req.body;
    const image = req.file;
    const removeBackground = req.body.removeBackground;
    
    // Parse resume data if it's a string
    if (typeof resumeData === 'string') {
      resumeData = JSON.parse(resumeData);
    }
    
    const shouldRemoveBackground = 
      removeBackground === true ||
      removeBackground === "true" ||
      removeBackground === "1" ||
      removeBackground === "yes";
    
    // Handle image upload with ImageKit
    if (image && imagekit) {
      const bufferData = fs.createReadStream(image.path);
      const uploadResponse = await imagekit.files.upload({
        file: bufferData,
        fileName: `resume-${Date.now()}.png`,
        folder: "user-resumes",
      });

      // Use delivery-time transforms for better reliability
      const transforms = ["w-400", "h-400", "c-thumb", "fo-face"];
      if (shouldRemoveBackground) transforms.push("e-bgremove");

      if (!resumeData.personalInfo) {
        resumeData.personalInfo = {};
      }
      resumeData.personalInfo.image = `${uploadResponse.url}?tr=${transforms.join(",")}`;
      
      // Clean up uploaded file
      fs.unlink(image.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
    }
    
    const updateData = {};
    if (resumeData.title !== undefined) updateData.title = resumeData.title;
    if (resumeData.template !== undefined) updateData.template = resumeData.template;
    if (resumeData.accentColor !== undefined) updateData.accentColor = resumeData.accentColor;
    if (resumeData.professionSummary !== undefined) updateData.professionSummary = resumeData.professionSummary;
    if (resumeData.skills !== undefined) updateData.skills = resumeData.skills;
    if (resumeData.personalInfo !== undefined) updateData.personalInfo = resumeData.personalInfo;
    if (resumeData.experience !== undefined) updateData.experience = resumeData.experience;
    if (resumeData.projects !== undefined) updateData.projects = resumeData.projects;
    if (resumeData.education !== undefined) updateData.education = resumeData.education;
    if (resumeData.profile !== undefined) updateData.profile = resumeData.profile;
    if (resumeData.public !== undefined) updateData.public = resumeData.public;
    
    const updatedResume = await prisma.resume.update({
      where: { id: req.params.id },
      data: updateData
    });
    
    // No need to parse JSON fields - PostgreSQL handles them natively
    const parsedResume = {
      ...updatedResume,
      skills: updatedResume.skills || [],
      personalInfo: updatedResume.personalInfo || {},
      experience: updatedResume.experience || [],
      projects: updatedResume.projects || [],
      education: updatedResume.education || []
    };
    
    res.json(parsedResume);
  } catch (error) {
    console.error('Resume update error:', error);
    res.status(500).json({ error: 'Failed to update resume' });
  }
});

// Delete resume
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const resume = await prisma.resume.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    
    await prisma.resume.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Resume deletion error:', error);
    res.status(500).json({ error: 'Failed to delete resume' });
  }
});

// Duplicate resume
router.post('/:id/duplicate', authenticate, async (req, res) => {
  try {
    const originalResume = await prisma.resume.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });
    
    if (!originalResume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    
    const duplicatedResume = await prisma.resume.create({
      data: {
        userId: req.user.id,
        title: `${originalResume.title} (Copy)`,
        template: originalResume.template,
        accentColor: originalResume.accentColor,
        professionSummary: originalResume.professionSummary,
        skills: originalResume.skills || [],
        personalInfo: originalResume.personalInfo || {},
        experience: originalResume.experience || [],
        projects: originalResume.projects || [],
        education: originalResume.education || [],
        profile: originalResume.profile || '',
        public: originalResume.public
      }
    });
    
    // No need to parse JSON fields - PostgreSQL handles them natively
    const parsedResume = {
      ...duplicatedResume,
      skills: duplicatedResume.skills || [],
      personalInfo: duplicatedResume.personalInfo || {},
      experience: duplicatedResume.experience || [],
      projects: duplicatedResume.projects || [],
      education: duplicatedResume.education || []
    };
    
    res.status(201).json(parsedResume);
  } catch (error) {
    console.error('Resume duplication error:', error);
    res.status(500).json({ error: 'Failed to duplicate resume' });
  }
});

export default router;