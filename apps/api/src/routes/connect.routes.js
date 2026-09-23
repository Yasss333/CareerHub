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

const isISOString = (value) => {
  return !isNaN(Date.parse(value));
};

// Resolve a senior identifier that may be either a User id or a SeniorProfile id
const resolveSeniorUserId = async (seniorId) => {
  const user = await prisma.user.findFirst({
    where: { id: seniorId, isAlumniMentor: true },
    select: { id: true }
  });
  if (user) return user.id;

  const profile = await prisma.seniorProfile.findUnique({
    where: { id: seniorId },
    select: { userId: true }
  });
  if (profile) {
    const owner = await prisma.user.findUnique({
      where: { id: profile.userId },
      select: { id: true, isAlumniMentor: true }
    });
    if (owner && owner.isAlumniMentor) return owner.id;
  }
  return null;
};

// Build a full DateTime from an ISO date (or Date) plus a "HH:MM" time string
const buildDateTime = (date, time) => {
  const d = new Date(date);
  const parts = String(time).split(':').map((n) => parseInt(n, 10));
  d.setHours(parts[0] || 0, parts[1] || 0, 0, 0);
  return d;
};

const toMinutes = (time) => {
  const parts = String(time).split(':').map((n) => parseInt(n, 10));
  return (parts[0] || 0) * 60 + (parts[1] || 0);
};

const sameDateTime = (a, b) => {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate() &&
    da.getHours() === db.getHours() &&
    da.getMinutes() === db.getMinutes()
  );
};

const dateOnly = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const slotsOverlap = (aStart, aEnd, bStart, bEnd) => {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
};

const dateOverlap = (aStart, aEnd, bStart, bEnd) => {
  return new Date(aStart).getTime() < new Date(bEnd).getTime() &&
    new Date(bStart).getTime() < new Date(aEnd).getTime();
};

// ============================================
// SENIOR PROFILE ROUTES
// ============================================

// Get all senior profiles (public discovery)
router.get('/seniors', async (req, res) => {
  try {
    const { domain, expertise, search, limit } = req.query;
    
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
        { company: { contains: search, mode: 'insensitive' } },
        { expertise: { has: search } }
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
            location: true,
            credibilityScore: true
          }
        }
      },
      orderBy: {
        rating: 'desc'
      },
      take: limit ? Math.min(parseInt(limit, 10) || 50, 100) : 50
    });
    
    res.json(seniors);
  } catch (error) {
    console.error('Fetch seniors error:', error);
    res.status(500).json({ error: 'Failed to fetch seniors' });
  }
});

// Get a single senior profile by profile id or user id (public)
router.get('/seniors/:id', async (req, res) => {
  try {
    const userId = await resolveSeniorUserId(req.params.id);
    if (!userId) {
      return res.status(404).json({ error: 'Senior not found' });
    }
    
    const profile = await prisma.seniorProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            title: true,
            company: true,
            location: true,
            university: true,
            credibilityScore: true
          }
        }
      }
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Senior profile not found' });
    }
    
    const reviews = await prisma.sessionFeedback.findMany({
      where: {
        booking: { seniorId: userId }
      },
      include: {
        booking: {
          select: {
            junior: {
              select: {
                id: true,
                name: true,
                avatar: true,
                university: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    
    res.json({
      profile,
      reviews
    });
  } catch (error) {
    console.error('Fetch senior error:', error);
    res.status(500).json({ error: 'Failed to fetch senior' });
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
            isAlumniMentor: true,
            title: true,
            company: true,
            location: true
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

// Create/update senior profile (accepts profile + optional user fields)
const upsertProfile = async (req, res) => {
  try {
    const {
      title, company, domain, role, bio, experience, location,
      expertise, achievements, availability, name, avatar
    } = req.body;
    
    const userData = {};
    if (name !== undefined) userData.name = name;
    if (avatar !== undefined) userData.avatar = avatar;
    if (title !== undefined) userData.title = title;
    if (company !== undefined) userData.company = company;
    if (location !== undefined) userData.location = location;

    await prisma.user.update({
      where: { id: req.user.id },
      data: { ...userData, isAlumniMentor: true }
    });
    
    const profileData = {
      title: title !== undefined ? String(title).trim() : '',
      company: company !== undefined ? String(company).trim() : '',
      domain: domain !== undefined ? String(domain).trim() : '',
      role: role !== undefined ? String(role).trim() : '',
      bio: bio !== undefined ? String(bio).trim() : '',
      experience: experience !== undefined ? Math.max(0, parseInt(experience, 10) || 0) : 0,
      location: location !== undefined ? String(location).trim() : '',
      expertise: Array.isArray(expertise) ? expertise.filter((e) => e && String(e).trim()).map((e) => String(e).trim()) : undefined,
      achievements: Array.isArray(achievements) ? achievements.filter((a) => a && String(a).trim()).map((a) => String(a).trim()) : undefined
    };
    if (availability !== undefined) {
      if (!['available', 'limited', 'booked'].includes(availability)) {
        return res.status(400).json({ error: 'Invalid availability status' });
      }
      profileData.availability = availability;
    }
    
    const profile = await prisma.seniorProfile.upsert({
      where: { userId: req.user.id },
      update: profileData,
      create: {
        userId: req.user.id,
        ...profileData,
        title: profileData.title || 'Mentor',
        experience: profileData.experience || 0,
        location: profileData.location || ''
      }
    });
    
    res.json(profile);
  } catch (error) {
    console.error('Save profile error:', error);
    res.status(500).json({ error: 'Failed to save profile' });
  }
};

router.post('/profile', authenticate, upsertProfile);
router.put('/profile', authenticate, upsertProfile);

// Remove senior profile / revoke mentor status
router.delete('/profile', authenticate, async (req, res) => {
  try {
    await prisma.seniorProfile.deleteMany({ where: { userId: req.user.id } });
    await prisma.availabilitySlot.deleteMany({ where: { seniorId: req.user.id } });
    await prisma.user.update({
      where: { id: req.user.id },
      data: { isAlumniMentor: false }
    });
    res.json({ message: 'Senior profile removed' });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ error: 'Failed to delete profile' });
  }
});

// ============================================
// AVAILABILITY ROUTES
// ============================================

// Get own availability slots
router.get('/availability', authenticate, async (req, res) => {
  try {
    const slots = await prisma.availabilitySlot.findMany({
      where: {
        seniorId: req.user.id
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });
    
    res.json(slots);
  } catch (error) {
    console.error('Fetch availability error:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Get a senior's availability slots (used on booking page)
router.get('/availability/:seniorId', async (req, res) => {
  try {
    const userId = await resolveSeniorUserId(req.params.seniorId);
    if (!userId) {
      return res.status(404).json({ error: 'Senior not found' });
    }
    
    const slots = await prisma.availabilitySlot.findMany({
      where: {
        seniorId: userId,
        date: { gte: dateOnly(new Date()) }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });
    
    res.json(slots.map((s) => ({
      id: s.id,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      booked: s.isBooked
    })));
  } catch (error) {
    console.error('Fetch senior availability error:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Validate and reject overlapping slots for a senior
const assertNoAvailabilityConflict = async (seniorId, date, startTime, endTime, excludeId) => {
  if (!endTime || toMinutes(startTime) >= toMinutes(endTime)) {
    return { error: 'startTime must be earlier than endTime' };
  }
  
  const sameDateSlots = await prisma.availabilitySlot.findMany({
    where: {
      seniorId,
      date: dateOnly(date),
      ...(excludeId ? { id: { not: excludeId } } : {})
    }
  });
  
  const overlap = sameDateSlots.some((slot) =>
    slotsOverlap(startTime, endTime, slot.startTime, slot.endTime)
  );
  
  if (overlap) {
    return { error: 'Slot overlaps with an existing availability slot' };
  }
  return null;
};

// Create availability slot(s). Accepts either a single
// { date, startTime, endTime } or { slots: [...] }
router.post('/availability', authenticate, requireAlumniMentor, async (req, res) => {
  try {
    const body = req.body || {};
    const list = Array.isArray(body.slots) ? body.slots : (body.date ? [body] : null);
    
    if (!list || list.length === 0) {
      return res.status(400).json({ error: 'Provide a date, startTime and endTime (or a slots array)' });
    }
    
    const created = [];
    for (const item of list) {
      const { date, startTime, endTime } = item;
      if (!date || !startTime || !endTime) {
        return res.status(400).json({ error: 'Each slot requires date, startTime and endTime' });
      }
      
      const conflict = await assertNoAvailabilityConflict(req.user.id, date, startTime, endTime);
      if (conflict) {
        return res.status(409).json({ error: `${conflict.error}: ${date}` });
      }
      
      const slot = await prisma.availabilitySlot.create({
        data: {
          seniorId: req.user.id,
          date: dateOnly(date),
          startTime: String(startTime),
          endTime: String(endTime),
          isBooked: false
        }
      });
      created.push(slot);
    }
    
    res.status(201).json(created);
  } catch (error) {
    console.error('Create availability error:', error);
    res.status(500).json({ error: 'Failed to create availability slot' });
  }
});

// Update availability slot
router.put('/availability/:id', authenticate, requireAlumniMentor, async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;
    
    const slot = await prisma.availabilitySlot.findFirst({
      where: {
        id: req.params.id,
        seniorId: req.user.id
      }
    });
    
    if (!slot) {
      return res.status(404).json({ error: 'Availability slot not found or unauthorized' });
    }
    
    if (slot.isBooked) {
      return res.status(409).json({ error: 'Cannot edit a booked slot' });
    }
    
    const nextDate = date ? dateOnly(date) : slot.date;
    const nextStart = startTime !== undefined ? String(startTime) : slot.startTime;
    const nextEnd = endTime !== undefined ? String(endTime) : slot.endTime;
    
    const conflict = await assertNoAvailabilityConflict(req.user.id, nextDate, nextStart, nextEnd, req.params.id);
    if (conflict) {
      return res.status(409).json({ error: conflict.error });
    }
    
    const updated = await prisma.availabilitySlot.update({
      where: { id: req.params.id },
      data: { date: nextDate, startTime: nextStart, endTime: nextEnd }
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ error: 'Failed to update availability slot' });
  }
});

// Delete availability slot
router.delete('/availability/:id', authenticate, requireAlumniMentor, async (req, res) => {
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
    
    if (slot.isBooked) {
      return res.status(409).json({ error: 'Cannot delete a booked slot' });
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

// Get user's sessions (as junior or senior), optionally filtered by status
router.get('/sessions', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    
    const where = {
      OR: [
        { juniorId: req.user.id },
        { seniorId: req.user.id }
      ]
    };
    if (status) {
      where.status = status;
    }
    
    const sessions = await prisma.sessionBooking.findMany({
      where,
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
    const { seniorId, scheduledTime, duration, topic, notes, availabilitySlotId } = req.body;
    
    if (!seniorId || !scheduledTime || !topic) {
      return res.status(400).json({ error: 'seniorId, scheduledTime and topic are required' });
    }
    
    const seniorUserId = await resolveSeniorUserId(seniorId);
    if (!seniorUserId) {
      return res.status(404).json({ error: 'Senior not found or not available' });
    }
    
    // Prevent mentor from booking themselves
    if (req.user.id === seniorUserId) {
      return res.status(403).json({ error: 'You cannot book a session with yourself' });
    }
    
    const requestedStart = new Date(scheduledTime);
    if (isNaN(requestedStart.getTime())) {
      return res.status(400).json({ error: 'Invalid scheduledTime' });
    }
    const dur = Math.min(Math.max(parseInt(duration, 10) || 45, 15), 120);
    const requestedEnd = new Date(requestedStart.getTime() + dur * 60000);
    
    let slot = null;
    if (availabilitySlotId) {
      // Verify the chosen slot belongs to the senior and matches the requested time
      slot = await prisma.availabilitySlot.findFirst({
        where: { id: availabilitySlotId, seniorId: seniorUserId }
      });
      if (!slot) {
        return res.status(404).json({ error: 'Availability slot not found' });
      }
      if (slot.isBooked) {
        return res.status(409).json({ error: 'Slot is no longer available' });
      }
      const slotStart = buildDateTime(slot.date, slot.startTime);
      const slotEnd = buildDateTime(slot.date, slot.endTime);
      if (!sameDateTime(slotStart, requestedStart) || !sameDateTime(slotEnd, requestedEnd)) {
        return res.status(400).json({ error: 'Scheduled time does not match the selected slot' });
      }
    }
    
    // Conflict detection: no overlapping active bookings for the senior
    const seniorBookings = await prisma.sessionBooking.findMany({
      where: {
        seniorId: seniorUserId,
        status: { in: ['pending', 'accepted', 'started'] }
      },
      select: { scheduledTime: true, duration: true }
    });
    const seniorConflict = seniorBookings.some((b) => {
      const bStart = new Date(b.scheduledTime);
      const bEnd = new Date(bStart.getTime() + b.duration * 60000);
      return dateOverlap(requestedStart, requestedEnd, bStart, bEnd);
    });
    if (seniorConflict) {
      return res.status(409).json({ error: 'Senior already has a session at this time' });
    }
    
    // Conflict detection for the junior
    const juniorBookings = await prisma.sessionBooking.findMany({
      where: {
        juniorId: req.user.id,
        status: { in: ['pending', 'accepted', 'started'] }
      },
      select: { scheduledTime: true, duration: true }
    });
    const juniorConflict = juniorBookings.some((b) => {
      const bStart = new Date(b.scheduledTime);
      const bEnd = new Date(bStart.getTime() + b.duration * 60000);
      return dateOverlap(requestedStart, requestedEnd, bStart, bEnd);
    });
    if (juniorConflict) {
      return res.status(409).json({ error: 'You already have a session at this time' });
    }
    
    // Mark the availability slot as booked
    if (slot) {
      await prisma.availabilitySlot.update({
        where: { id: slot.id },
        data: { isBooked: true }
      });
    }
    
    // Generate Jitsi meeting details
    const bookingId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const jitsiRoomName = `seniorconnect-session-${bookingId}`;
    const jitsiRoomUrl = `https://meet.jit.si/${jitsiRoomName}`;
    
    const session = await prisma.sessionBooking.create({
      data: {
        juniorId: req.user.id,
        seniorId: seniorUserId,
        availabilitySlotId: slot ? slot.id : null,
        scheduledTime: requestedStart,
        duration: dur,
        topic: String(topic).trim(),
        notes: notes ? String(notes).trim() : '',
        status: 'pending',
        jitsiRoomName,
        jitsiRoomUrl
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
      }
    });
    
    res.status(201).json(session);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Cancel session (junior or senior owner)
router.delete('/sessions/:id', authenticate, async (req, res) => {
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
      return res.status(404).json({ error: 'Session not found or unauthorized' });
    }
    
    if (['completed', 'cancelled', 'rejected'].includes(session.status)) {
      return res.status(400).json({ error: 'Session is already closed' });
    }
    
    // Free the availability slot
    if (session.availabilitySlotId) {
      await prisma.availabilitySlot.update({
        where: { id: session.availabilitySlotId },
        data: { isBooked: false }
      });
    }
    
    const updated = await prisma.sessionBooking.update({
      where: { id: req.params.id },
      data: { status: 'cancelled' }
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Cancel session error:', error);
    res.status(500).json({ error: 'Failed to cancel session' });
  }
});

// Update session status (senior: accepted / rejected / cancelled)
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
    
    if (session.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending sessions can be accepted or rejected' });
    }
    
    // Free the availability slot when rejecting or cancelling
    if ((status === 'rejected' || status === 'cancelled') && session.availabilitySlotId) {
      await prisma.availabilitySlot.update({
        where: { id: session.availabilitySlotId },
        data: { isBooked: false }
      });
    }
    
    const updatedSession = await prisma.sessionBooking.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        junior: { select: { id: true, name: true, avatar: true, university: true } },
        senior: { select: { id: true, name: true, avatar: true, title: true, company: true } }
      }
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
    
    if (session.status !== 'started') {
      return res.status(400).json({ error: 'Session must be started before completing' });
    }
    
    const updatedSession = await prisma.sessionBooking.update({
      where: { id: req.params.id },
      data: { status: 'completed', scheduledTime: session.scheduledTime },
      include: {
        junior: { select: { id: true, name: true, avatar: true, university: true } },
        senior: { select: { id: true, name: true, avatar: true, title: true, company: true } }
      }
    });
    
    // Update senior session count
    await prisma.seniorProfile.updateMany({
      where: { userId: session.seniorId },
      data: {
        sessionCount: { increment: 1 }
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
    
    if (!rating || !Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }
    
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
    
    const existing = await prisma.sessionFeedback.findFirst({
      where: { bookingId: req.params.id }
    });
    if (existing) {
      return res.status(409).json({ error: 'Feedback already submitted for this session' });
    }
    
    const feedback = await prisma.sessionFeedback.create({
      data: {
        bookingId: req.params.id,
        rating: Number(rating),
        comment: comment ? String(comment).trim() : '',
        tags: Array.isArray(tags) ? tags.filter((t) => t && String(t).trim()).map((t) => String(t).trim()) : []
      }
    });
    
    // Store embedded feedback on the booking
    await prisma.sessionBooking.update({
      where: { id: req.params.id },
      data: {
        feedback: {
          rating: Number(rating),
          comment: comment ? String(comment).trim() : '',
          tags: Array.isArray(tags) ? tags : [],
          submittedAt: new Date()
        }
      }
    });
    
    // Recompute senior aggregate rating from all feedback
    const allFeedback = await prisma.sessionFeedback.findMany({
      where: {
        booking: { seniorId: session.seniorId }
      },
      select: { rating: true }
    });
    
    if (allFeedback.length > 0) {
      const total = allFeedback.reduce((sum, f) => sum + f.rating, 0);
      const avg = Math.round((total / allFeedback.length) * 10) / 10;
      await prisma.seniorProfile.updateMany({
        where: { userId: session.seniorId },
        data: { rating: avg, reviewCount: allFeedback.length }
      });
    }
    
    res.status(201).json(feedback);
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Get a senior's feedback and rating summary
router.get('/feedback/:seniorId', async (req, res) => {
  try {
    const userId = await resolveSeniorUserId(req.params.seniorId);
    if (!userId) {
      return res.status(404).json({ error: 'Senior not found' });
    }
    
    const [feedbacks, profile] = await Promise.all([
      prisma.sessionFeedback.findMany({
        where: {
          booking: { seniorId: userId }
        },
        include: {
          booking: {
            select: {
              junior: {
                select: { id: true, name: true, avatar: true, university: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      prisma.seniorProfile.findUnique({
        where: { userId },
        select: { rating: true, reviewCount: true }
      })
    ]);
    
    res.json({
      rating: profile?.rating || 0,
      reviewCount: profile?.reviewCount || 0,
      feedbacks
    });
  } catch (error) {
    console.error('Fetch feedback error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

export default router;