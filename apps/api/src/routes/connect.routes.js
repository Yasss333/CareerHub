import express from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'careerhub-super-secret-jwt-key-2024';

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

const requireAlumniMentor = (req, res, next) => {
  if (!req.user || !req.user.isAlumniMentor) {
    return res.status(403).json({ error: 'Alumni mentor status required' });
  }
  next();
};

// ============================================
// SENIOR PROFILE ROUTES
// ============================================

// Get all senior profiles (public discovery)
router.get('/seniors', async (req, res) => {
  try {
    const { domain, expertise, search } = req.query;
    
    const where = {
      user: {
        isAlumniMentor: true
      }
    };
    
    if (domain) {
      where.domain = domain;
    }
    
    if (expertise) {
      where.expertise = {
        has: expertise
      };
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const seniors = await prisma.seniorProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            title: true,
            company: true,
            credibilityScore: true
          }
        }
      },
      orderBy: {
        rating: 'desc'
      }
    });
    
    res.json(seniors);
  } catch (error) {
    console.error('Fetch seniors error:', error);
    res.status(500).json({ error: 'Failed to fetch seniors' });
  }
});

// Get current user's senior profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const profile = await prisma.seniorProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            isAlumniMentor: true
          }
        }
      }
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Senior profile not found' });
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Create/update senior profile
router.post('/profile', authenticate, async (req, res) => {
  try {
    const {
      title, company, domain, role, bio, experience, location,
      expertise, achievements, availability
    } = req.body;
    
    // First, ensure user is marked as alumni mentor
    await prisma.user.update({
      where: { id: req.user.id },
      data: { isAlumniMentor: true }
    });
    
    const profile = await prisma.seniorProfile.upsert({
      where: { userId: req.user.id },
      update: {
        title, company, domain, role, bio, experience, location,
        expertise, achievements, availability
      },
      create: {
        userId: req.user.id,
        title, company, domain, role, bio, experience, location,
        expertise, achievements, availability
      }
    });
    
    res.json(profile);
  } catch (error) {
    console.error('Save profile error:', error);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// ============================================
// AVAILABILITY ROUTES
// ============================================

// Get senior's availability slots
router.get('/availability', authenticate, async (req, res) => {
  try {
    const slots = await prisma.availabilitySlot.findMany({
      where: {
        seniorId: req.user.id,
        date: {
          gte: new Date()
        }
      },
      orderBy: {
        date: 'asc'
      }
    });
    
    res.json(slots);
  } catch (error) {
    console.error('Fetch availability error:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Create availability slot
router.post('/availability', authenticate, async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;
    
    const slot = await prisma.availabilitySlot.create({
      data: {
        seniorId: req.user.id,
        date: new Date(date),
        startTime,
        endTime
      }
    });
    
    res.status(201).json(slot);
  } catch (error) {
    console.error('Create availability error:', error);
    res.status(500).json({ error: 'Failed to create availability slot' });
  }
});

// Delete availability slot
router.delete('/availability/:id', authenticate, async (req, res) => {
  try {
    const slot = await prisma.availabilitySlot.findFirst({
      where: {
        id: req.params.id,
        seniorId: req.user.id
      }
    });
    
    if (!slot) {
      return res.status(404).json({ error: 'Availability slot not found or unauthorized' });
    }
    
    await prisma.availabilitySlot.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: 'Availability slot deleted' });
  } catch (error) {
    console.error('Delete availability error:', error);
    res.status(500).json({ error: 'Failed to delete availability slot' });
  }
});

// ============================================
// SESSION BOOKING ROUTES
// ============================================

// Get user's sessions (as junior or senior)
router.get('/sessions', authenticate, async (req, res) => {
  try {
    const sessions = await prisma.sessionBooking.findMany({
      where: {
        OR: [
          { juniorId: req.user.id },
          { seniorId: req.user.id }
        ]
      },
      include: {
        junior: {
          select: {
            id: true,
            name: true,
            avatar: true,
            university: true
          }
        },
        senior: {
          select: {
            id: true,
            name: true,
            avatar: true,
            title: true,
            company: true
          }
        }
      },
      orderBy: {
        scheduledTime: 'desc'
      }
    });
    
    res.json(sessions);
  } catch (error) {
    console.error('Fetch sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Create session booking request
router.post('/sessions', authenticate, async (req, res) => {
  try {
    const { seniorId, scheduledTime, duration, topic, notes } = req.body;
    
    // Check if senior exists and is alumni mentor
    const senior = await prisma.user.findFirst({
      where: {
        id: seniorId,
        isAlumniMentor: true
      }
    });
    
    if (!senior) {
      return res.status(404).json({ error: 'Senior not found or not available' });
    }
    
    // Generate Jitsi meeting details
    const bookingId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const jitsiRoomName = `seniorconnect-session-${bookingId}`;
    const jitsiRoomUrl = `https://meet.jit.si/${jitsiRoomName}`;
    
    const session = await prisma.sessionBooking.create({
      data: {
        juniorId: req.user.id,
        seniorId,
        scheduledTime: new Date(scheduledTime),
        duration: duration || 45,
        topic,
        notes: notes || '',
        status: 'pending',
        jitsiRoomName,
        jitsiRoomUrl
      },
      include: {
        junior: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        senior: {
          select: {
            id: true,
            name: true,
            avatar: true,
            title: true,
            company: true
          }
        }
      }
    });
    
    res.status(201).json(session);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Accept/reject session (senior only)
router.put('/sessions/:id/status', authenticate, requireAlumniMentor, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['accepted', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const session = await prisma.sessionBooking.findFirst({
      where: {
        id: req.params.id,
        seniorId: req.user.id
      }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const updatedSession = await prisma.sessionBooking.update({
      where: { id: req.params.id },
      data: { status }
    });
    
    res.json(updatedSession);
  } catch (error) {
    console.error('Update session status error:', error);
    res.status(500).json({ error: 'Failed to update session status' });
  }
});

// Start session (generates/returns Jitsi URL)
router.post('/sessions/:id/start', authenticate, async (req, res) => {
  try {
    const session = await prisma.sessionBooking.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { juniorId: req.user.id },
          { seniorId: req.user.id }
        ]
      }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.status !== 'accepted') {
      return res.status(400).json({ error: 'Session must be accepted before starting' });
    }
    
    // Update session status to started
    const updatedSession = await prisma.sessionBooking.update({
      where: { id: req.params.id },
      data: { status: 'started' }
    });
    
    res.json({
      jitsiRoomUrl: updatedSession.jitsiRoomUrl,
      jitsiRoomName: updatedSession.jitsiRoomName
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// Complete session
router.post('/sessions/:id/complete', authenticate, async (req, res) => {
  try {
    const session = await prisma.sessionBooking.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { juniorId: req.user.id },
          { seniorId: req.user.id }
        ]
      }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const updatedSession = await prisma.sessionBooking.update({
      where: { id: req.params.id },
      data: { status: 'completed' }
    });
    
    // Update senior session count
    await prisma.seniorProfile.update({
      where: { userId: session.seniorId },
      data: {
        sessionCount: {
          increment: 1
        }
      }
    });
    
    res.json(updatedSession);
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

// ============================================
// FEEDBACK ROUTES
// ============================================

// Submit session feedback (junior only)
router.post('/sessions/:id/feedback', authenticate, async (req, res) => {
  try {
    const { rating, comment, tags } = req.body;
    
    const session = await prisma.sessionBooking.findFirst({
      where: {
        id: req.params.id,
        juniorId: req.user.id
      }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.status !== 'completed') {
      return res.status(400).json({ error: 'Can only submit feedback for completed sessions' });
    }
    
    // Create feedback
    const feedback = await prisma.sessionFeedback.create({
      data: {
        bookingId: req.params.id,
        rating,
        comment,
        tags: tags || []
      }
    });
    
    // Update session with feedback
    await prisma.sessionBooking.update({
      where: { id: req.params.id },
      data: {
        feedback: {
          rating,
          comment,
          tags,
          submittedAt: new Date()
        }
      }
    });
    
    // Update senior rating
    const seniorProfile = await prisma.seniorProfile.findUnique({
      where: { userId: session.seniorId }
    });
    
    if (seniorProfile) {
      const newRating = ((seniorProfile.rating * seniorProfile.reviewCount) + rating) / (seniorProfile.reviewCount + 1);
      
      await prisma.seniorProfile.update({
        where: { userId: session.seniorId },
        data: {
          rating: newRating,
          reviewCount: {
            increment: 1
          }
        }
      });
    }
    
    res.status(201).json(feedback);
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

export default router;