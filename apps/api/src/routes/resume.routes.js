import express from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import ImageKit from '@imagekit/nodejs';

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

// Update resume
router.put('/:id', authenticate, async (req, res) => {
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
    
    const updateData = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.template !== undefined) updateData.template = req.body.template;
    if (req.body.accentColor !== undefined) updateData.accentColor = req.body.accentColor;
    if (req.body.professionSummary !== undefined) updateData.professionSummary = req.body.professionSummary;
    if (req.body.skills !== undefined) updateData.skills = req.body.skills;
    if (req.body.personalInfo !== undefined) updateData.personalInfo = req.body.personalInfo;
    if (req.body.experience !== undefined) updateData.experience = req.body.experience;
    if (req.body.projects !== undefined) updateData.projects = req.body.projects;
    if (req.body.education !== undefined) updateData.education = req.body.education;
    if (req.body.profile !== undefined) updateData.profile = req.body.profile;
    if (req.body.public !== undefined) updateData.public = req.body.public;
    
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