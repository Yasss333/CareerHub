import express from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import openai from '../config/ai.js';
import { generateLiveKitToken, isLiveKitConfigured } from '../services/livekit.service.js';
import { recordActivityStreak } from '../services/activity-streak.service.js';

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

const requireAlumniMentor = async (req, res, next) => {
  try {
    const user = req.user
      ? await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { isAlumniMentor: true, mentorApprovalStatus: true, role: true }
        })
      : null;

    if (!user || (!user.isAlumniMentor && user.role !== 'MENTOR' && user.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Mentor access is required' });
    }

    return next();
  } catch (error) {
    console.error('Mentor authorization error:', error);
    return res.status(500).json({ error: 'Failed to verify mentor permissions' });
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    const user = req.user
      ? await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { role: true }
        })
      : null;

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Administrator access required' });
    }

    return next();
  } catch (error) {
    console.error('Administrator authorization error:', error);
    return res.status(500).json({ error: 'Failed to verify administrator permissions' });
  }
};

const isISOString = (value) => {
  return !isNaN(Date.parse(value));
};

// Resolve a senior identifier that may be either a User id or a SeniorProfile id
const resolveSeniorUserId = async (seniorId) => {
  const user = await prisma.user.findFirst({
    where: {
      id: seniorId,
      OR: [{ isAlumniMentor: true }, { role: 'MENTOR' }, { seniorProfile: { isNot: null } }]
    },
    select: { id: true }
  });
  if (user) return user.id;

  const profile = await prisma.seniorProfile.findUnique({
    where: { id: seniorId },
    select: { userId: true }
  });
  if (profile) return profile.userId;

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
    
    const where = {};
    
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
            mentorApprovalStatus: true,
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
      expertise, achievements, availability, name, avatar, timezone, hourlyRate
    } = req.body;

    const userData = {};
    if (name !== undefined) userData.name = name;
    if (avatar !== undefined) {
      userData.avatar = avatar;
      userData.image = avatar;
    }
    if (title !== undefined) userData.title = title;
    if (company !== undefined) userData.company = company;
    if (location !== undefined) userData.location = location;
    if (timezone !== undefined) userData.timezone = timezone;

    const profileData = {
      title: title !== undefined ? String(title).trim() : '',
      company: company !== undefined ? String(company).trim() : '',
      domain: domain !== undefined ? String(domain).trim() : '',
      role: role !== undefined ? String(role).trim() : '',
      bio: bio !== undefined ? String(bio).trim() : '',
      experience: experience !== undefined ? Math.max(0, parseInt(experience, 10) || 0) : 0,
      location: location !== undefined ? String(location).trim() : '',
      expertise: Array.isArray(expertise) ? expertise.filter((e) => e && String(e).trim()).map((e) => String(e).trim()) : undefined,
      achievements: Array.isArray(achievements) ? achievements.filter((a) => a && String(a).trim()).map((a) => String(a).trim()) : undefined,
      hourlyRate: hourlyRate !== undefined ? Math.max(0, parseInt(hourlyRate, 10) || 0) : 0
    };
    if (availability !== undefined) {
      if (!['available', 'limited', 'booked'].includes(availability)) {
        return res.status(400).json({ error: 'Invalid availability status' });
      }
      profileData.availability = availability;
    }
    
    const result = await prisma.$transaction(async (transaction) => {
      const currentUser = await transaction.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, role: true, isAlumniMentor: true, mentorApprovalStatus: true }
      });
      if (!currentUser) throw new Error('User account not found');

      // Topmate-style: auto-approved and promoted to MENTOR role!
      const mentorApprovalStatus = 'APPROVED';
      const roleUpdate = currentUser.role === 'ADMIN' ? {} : { role: 'MENTOR' };

      const updatedUser = await transaction.user.update({
        where: { id: req.user.id },
        data: {
          ...userData,
          isAlumniMentor: true,
          mentorApprovalStatus: 'APPROVED',
          ...roleUpdate
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          isAlumniMentor: true,
          mentorApprovalStatus: true
        }
      });

      const profile = await transaction.seniorProfile.upsert({
        where: { userId: req.user.id },
        update: profileData,
        create: {
          userId: req.user.id,
          ...profileData,
          title: profileData.title || '',
          experience: profileData.experience || 0,
          location: profileData.location || ''
        }
      });

      return { profile, user: updatedUser, mentorApprovalStatus: 'APPROVED' };
    });
    
    res.json(result);
  } catch (error) {
    console.error('Save profile error:', error);
    res.status(500).json({ error: 'Failed to save profile' });
  }
};

router.post('/profile', authenticate, upsertProfile);
router.put('/profile', authenticate, upsertProfile);

// AI-powered resume parser for senior mentors (Auto-fill profile)
router.post('/parse-senior-resume', authenticate, async (req, res) => {
  try {
    const { resumeText } = req.body || {};
    if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 20) {
      return res.status(400).json({ error: 'Please provide valid resume text or upload a PDF resume.' });
    }

    let parsedProfile = null;

    try {
      const apiKey = process.env.OPENROUTER_API_KEY?.trim();
      if (apiKey && !/^(your|replace|placeholder)/i.test(apiKey)) {
        const systemPrompt = `You are an expert tech recruiter and mentor profile extractor.
Parse the following senior developer/engineer's resume into a structured mentor profile JSON.
Only use facts explicitly present in the resume. Never infer or invent a name, title, company, location, years of experience, bio, expertise, achievements, or hourly rate. Use empty strings, 0, or [] when the resume does not state a value.
Return ONLY valid JSON with this exact structure:
{
  "name": "Candidate Full Name",
  "title": "Current or most recent Job Title (e.g. Senior Software Engineer)",
  "company": "Current or most recent Company (e.g. Google, Microsoft, Startup)",
  "domain": "One of: Backend, Frontend, Fullstack, Data, DevOps, Mobile, AI/ML, Management, Other",
  "role": "Specific engineering role (e.g. Backend Lead, Frontend Engineer)",
  "experience": number (total years of professional experience as integer, e.g. 5),
  "location": "City, Country (e.g. Bengaluru, India or San Francisco, USA)",
  "bio": "A concise, engaging 2-3 sentence mentor bio highlighting their background, tech stack, and what they can guide juniors on.",
  "expertise": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"] (top 4-7 technical skills or mentorship topics),
  "achievements": ["Achievement 1", "Achievement 2"] (1-3 notable achievements or career milestones),
  "hourlyRate": 0
}
Do not include any text outside the JSON object.`;

        const response = await openai.chat.completions.create({
          model: process.env.MODEL_NAME || "openai/gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Resume Content:\n${resumeText.slice(0, 8000)}` }
          ],
          response_format: { type: "json_object" }
        });

        const raw = response.choices[0]?.message?.content;
        if (raw) {
          parsedProfile = JSON.parse(raw);
        }
      }
    } catch (aiErr) {
      console.warn('AI senior resume parsing error:', aiErr.message);
    }

    const account = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { name: true, title: true, company: true, location: true }
    });
    const accountProfile = {
      name: account?.name || '',
      title: account?.title || '',
      company: account?.company || '',
      domain: '',
      role: '',
      experience: 0,
      location: account?.location || '',
      bio: '',
      expertise: [],
      achievements: [],
      hourlyRate: 0
    };
    const resumeProfile = parsedProfile && typeof parsedProfile === 'object' && !Array.isArray(parsedProfile)
      ? parsedProfile
      : {};

    return res.json({
      profile: {
        ...accountProfile,
        ...resumeProfile,
        name: resumeProfile.name || accountProfile.name,
        title: resumeProfile.title || accountProfile.title,
        company: resumeProfile.company || accountProfile.company,
        location: resumeProfile.location || accountProfile.location,
        experience: Number.isFinite(Number(resumeProfile.experience)) ? Number(resumeProfile.experience) : 0,
        expertise: Array.isArray(resumeProfile.expertise) ? resumeProfile.expertise : [],
        achievements: Array.isArray(resumeProfile.achievements) ? resumeProfile.achievements : []
      }
    });
  } catch (err) {
    console.error('Parse senior resume error:', err);
    return res.status(500).json({ error: 'Failed to parse resume: ' + err.message });
  }
});

router.get('/admin/mentor-applications', authenticate, requireAdmin, async (req, res) => {
  try {
    const applications = await prisma.user.findMany({
      where: { mentorApprovalStatus: 'PENDING' },
      select: {
        id: true,
        name: true,
        email: true,
        title: true,
        company: true,
        location: true,
        mentorApprovalStatus: true,
        seniorProfile: {
          select: {
            title: true,
            company: true,
            domain: true,
            role: true,
            bio: true,
            experience: true,
            location: true,
            expertise: true,
            achievements: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json(applications);
  } catch (error) {
    console.error('Fetch mentor applications error:', error);
    res.status(500).json({ error: 'Failed to fetch mentor applications' });
  }
});

router.patch('/admin/mentor-applications/:userId', authenticate, requireAdmin, async (req, res) => {
  const { decision } = req.body || {};
  if (!['approve', 'reject'].includes(decision)) {
    return res.status(400).json({ error: "Decision must be 'approve' or 'reject'" });
  }

  try {
    const status = decision === 'approve' ? 'APPROVED' : 'REJECTED';
    const reviewed = await prisma.$transaction(async (transaction) => {
      const applicant = await transaction.user.findUnique({
        where: { id: req.params.userId },
        select: { role: true, mentorApprovalStatus: true }
      });

      if (!applicant || applicant.mentorApprovalStatus !== 'PENDING') return false;

      const updated = await transaction.user.updateMany({
        where: { id: req.params.userId, mentorApprovalStatus: 'PENDING' },
        data: {
          mentorApprovalStatus: status,
          isAlumniMentor: decision === 'approve',
          role: applicant.role === 'ADMIN' ? 'ADMIN' : decision === 'approve' ? 'MENTOR' : 'USER'
        }
      });

      return updated.count > 0;
    });

    if (!reviewed) {
      return res.status(404).json({ error: 'Pending mentor application not found' });
    }

    res.json({ userId: req.params.userId, mentorApprovalStatus: status });
  } catch (error) {
    console.error('Review mentor application error:', error);
    res.status(500).json({ error: 'Failed to review mentor application' });
  }
});

// Remove senior profile / revoke mentor status
router.delete('/profile', authenticate, async (req, res) => {
  try {
    const account = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true }
    });

    await prisma.seniorProfile.deleteMany({ where: { userId: req.user.id } });
    await prisma.availabilitySlot.deleteMany({ where: { seniorId: req.user.id } });
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        isAlumniMentor: false,
        mentorApprovalStatus: 'NONE',
        role: account?.role === 'MENTOR' ? 'USER' : account?.role
      }
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
// { date, startTime, endTime, timezone } or { slots: [...] }
router.post('/availability', authenticate, requireAlumniMentor, async (req, res) => {
  try {
    const body = req.body || {};
    const list = Array.isArray(body.slots) ? body.slots : (body.date ? [body] : null);

    if (!list || list.length === 0) {
      return res.status(400).json({ error: 'Provide a date, startTime and endTime (or a slots array)' });
    }

    const created = [];
    for (const item of list) {
      const { date, startTime, endTime, timezone } = item;
      if (!date || !startTime || !endTime) {
        return res.status(400).json({ error: 'Each slot requires date, startTime and endTime' });
      }

      // Only today or future dates are allowed
      if (dateOnly(date).getTime() < dateOnly(new Date()).getTime()) {
        return res.status(400).json({ error: `Slots cannot be created for past dates: ${date}` });
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
          timezone: timezone || 'UTC',
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

    // Reject moving a slot into the past
    if (dateOnly(nextDate).getTime() < dateOnly(new Date()).getTime()) {
      return res.status(400).json({ error: 'Slots cannot be moved to past dates' });
    }

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

// Compute student's Placement Readiness Index (PRI) snapshot for mentor review
const getCandidatePriSummary = async (userId) => {
  try {
    const [interviewSessions, solvedProblems, resumes] = await Promise.all([
      prisma.interviewSession.findMany({
        where: { userId, status: 'completed' },
        select: { id: true, feedback: true },
        take: 10
      }),
      prisma.problemSolved.findMany({
        where: { userId },
        select: { id: true }
      }),
      prisma.resume.findMany({
        where: { userId },
        select: {
          professionSummary: true,
          skills: true,
          experience: true,
          education: true,
          projects: true,
          personalInfo: true,
        },
        take: 5
      })
    ]);

    let totalInterviewScore = 0;
    let validInterviewCount = 0;
    for (const s of interviewSessions) {
      const overall = Number(s.feedback?.overall_score || s.feedback?.score || s.feedback?.overallScore);
      if (!isNaN(overall) && overall > 0) {
        totalInterviewScore += overall;
        validInterviewCount++;
      }
    }
    const interviewAvg = validInterviewCount > 0 ? Math.round(totalInterviewScore / validInterviewCount) : 0;
    const dsaScore = Math.min(100, Math.round((solvedProblems.length / 25) * 100));
    const resumeScore = resumes.reduce((bestScore, resume) => {
      let score = 0;
      if (resume.professionSummary && resume.professionSummary.length > 20) score += 15;
      if (resume.skills?.length >= 3) score += 15;
      if (resume.experience?.length > 0) score += 20;
      if (resume.education?.length > 0) score += 10;
      if (resume.projects?.length > 0) score += 10;
      if (resume.personalInfo && Object.keys(resume.personalInfo).length > 0) score += 30;
      return Math.max(bestScore, Math.min(100, score));
    }, 0);

    const pri = Math.round(interviewAvg * 0.45 + dsaScore * 0.40 + resumeScore * 0.15);

    return {
      score: pri,
      interviewAvg,
      interviewCount: validInterviewCount,
      problemsSolved: solvedProblems.length,
      dsaScore,
      resumeScore,
      resumesCount: resumes.length,
      readinessLevel: pri >= 80 ? 'High' : pri >= 60 ? 'Moderate' : 'Developing'
    };
  } catch (error) {
    console.error('Failed to compute candidate PRI summary:', error);
    return {
      score: 0,
      interviewAvg: 0,
      interviewCount: 0,
      problemsSolved: 0,
      dsaScore: 0,
      resumeScore: 0,
      resumesCount: 0,
      readinessLevel: 'Developing'
    };
  }
};

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

    const sessionsWithPri = await Promise.all(
      sessions.map(async (session) => {
        let juniorPri = null;
        if (session.juniorId) {
          juniorPri = await getCandidatePriSummary(session.juniorId);
        }
        return {
          ...session,
          junior: session.junior
            ? {
                ...session.junior,
                pri: juniorPri
              }
            : null
        };
      })
    );
    
    res.json(sessionsWithPri);
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

    // Reject bookings in the past
    if (requestedStart.getTime() <= Date.now()) {
      return res.status(400).json({ error: 'Cannot book a session in the past. Please pick a future date and time.' });
    }

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

    // Create notification for senior
    await createNotification(
      seniorUserId,
      'session_request',
      'New Session Request',
      `${req.user.name || 'A junior'} wants to book a session with you on ${topic}`,
      { bookingId: session.id, juniorId: req.user.id }
    );
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

    // Create notification for junior
    await createNotification(
      session.juniorId,
      status === 'accepted' ? 'session_accepted' : 'session_rejected',
      status === 'accepted' ? 'Session Accepted' : 'Session Rejected',
      status === 'accepted'
        ? `Your session request has been accepted by ${req.user.name || 'your mentor'}`
        : `Your session request has been declined by ${req.user.name || 'your mentor'}`,
      { bookingId: session.id, seniorId: req.user.id }
    );

    res.json(updatedSession);
  } catch (error) {
    console.error('Update session status error:', error);
    res.status(500).json({ error: 'Failed to update session status' });
  }
});

// Start session (generates/returns Jitsi URL, allows re-join)
router.post('/sessions/:id/start', authenticate, async (req, res) => {
  try {
    const session = await prisma.sessionBooking.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { juniorId: req.user.id },
          { seniorId: req.user.id }
        ]
      },
      include: {
        junior: { select: { id: true, name: true } },
        senior: { select: { id: true, name: true } }
      }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.status !== 'accepted' && session.status !== 'started') {
      return res.status(400).json({ error: 'Session must be accepted or started' });
    }
    
    let updatedSession = session;
    if (session.status !== 'started') {
      updatedSession = await prisma.sessionBooking.update({
        where: { id: req.params.id },
        data: { status: 'started' }
      });

      // Dispatch in-app notification to the other participant (candidate or mentor)
      const targetUserId = req.user.id === session.seniorId ? session.juniorId : session.seniorId;
      const callerName = req.user.name || (req.user.id === session.seniorId ? 'Mentor' : 'Candidate');
      
      try {
        await prisma.notification.create({
          data: {
            userId: targetUserId,
            type: 'session_started',
            title: 'Meeting Started - Please Join Now!',
            message: `${callerName} has started the video meeting for "${session.topic}". Click to join immediately.`,
            data: {
              sessionId: session.id,
              jitsiRoomUrl: updatedSession.jitsiRoomUrl,
              topic: session.topic
            }
          }
        });
      } catch (notifErr) {
        console.warn('Failed to create session_started notification:', notifErr.message);
      }
    }
    
    res.json({
      jitsiRoomUrl: updatedSession.jitsiRoomUrl,
      jitsiRoomName: updatedSession.jitsiRoomName,
      status: 'started'
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
    
    if (session.status !== 'started' && session.status !== 'accepted') {
      return res.status(400).json({ error: 'Session must be active before completing' });
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

    await Promise.all([
      recordActivityStreak(prisma, session.juniorId),
      recordActivityStreak(prisma, session.seniorId)
    ]);
    
    res.json(updatedSession);
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

// ============================================
// SESSION CHAT ROUTES
// ============================================

// Get chat messages for a session
router.get('/sessions/:id/messages', authenticate, async (req, res) => {
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

    const unreadMessageNotifications = await prisma.notification.findMany({
      where: { userId: req.user.id, type: 'session_message', isRead: false },
      select: { id: true, data: true },
    });
    const notificationsToClear = unreadMessageNotifications
      .filter((notification) => notification.data?.bookingId === session.id)
      .map((notification) => notification.id);
    if (notificationsToClear.length > 0) {
      await prisma.notification.updateMany({
        where: { id: { in: notificationsToClear }, userId: req.user.id },
        data: { isRead: true },
      });
    }

    const messages = await prisma.sessionMessage.findMany({
      where: { sessionId: session.id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(messages);
  } catch (error) {
    console.error('Fetch session messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a chat message in a session
router.post('/sessions/:id/messages', authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

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

    const created = await prisma.sessionMessage.create({
      data: {
        sessionId: session.id,
        senderId: req.user.id,
        message: message.trim()
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true
          }
        }
      }
    });

    // Notify the other participant
    const recipientId = req.user.id === session.juniorId ? session.seniorId : session.juniorId;
    const senderUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { name: true }
    });

    await createNotification(
      recipientId,
      'session_message',
      'New Message',
      `${senderUser?.name || 'Someone'} sent you a message for "${session.topic}"`,
      { bookingId: session.id }
    );

    res.status(201).json(created);
  } catch (error) {
    console.error('Send session message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ============================================
// LIVEKIT VIDEO CONFERENCING ROUTES
// ============================================

// Check LiveKit status and availability
router.get('/video/status', authenticate, async (req, res) => {
  try {
    const configured = isLiveKitConfigured();
    res.json({
      livekitAvailable: configured,
      provider: configured ? 'livekit' : 'jitsi'
    });
  } catch (error) {
    res.json({ livekitAvailable: false, provider: 'jitsi' });
  }
});

// Generate LiveKit token for a session
router.get('/sessions/:id/livekit-token', authenticate, async (req, res) => {
  try {
    const session = await prisma.sessionBooking.findUnique({
      where: { id: req.params.id },
      include: {
        junior: { select: { id: true, name: true } },
        senior: { select: { id: true, name: true } }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const isJunior = session.juniorId === req.user.id;
    const isSenior = session.seniorId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isJunior && !isSenior && !isAdmin) {
      return res.status(403).json({ error: 'You are not authorized to join this meeting' });
    }

    if (session.status === 'cancelled' || session.status === 'rejected') {
      return res.status(400).json({ error: 'This session has been cancelled or rejected' });
    }

    // Default fallback Jitsi URL
    const fallbackUrl = session.jitsiRoomUrl || `https://meet.jit.si/seniorconnect-session-${session.id}`;

    // If LiveKit is not configured, signal client to use Jitsi fallback
    if (!isLiveKitConfigured()) {
      return res.json({
        available: false,
        provider: 'jitsi',
        fallbackUrl,
        message: 'LiveKit server is not configured. Falling back to Jitsi Meet.'
      });
    }

    // User display name
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { name: true, role: true }
    });

    const roomName = `careerhub-session-${session.id}`;
    const tokenData = await generateLiveKitToken({
      roomName,
      participantIdentity: req.user.id,
      participantName: currentUser?.name || req.user.name || 'Participant',
      isMentor: isSenior || isAdmin
    });

    res.json({
      available: true,
      provider: 'livekit',
      token: tokenData.token,
      serverUrl: tokenData.serverUrl,
      roomName: tokenData.roomName,
      participantIdentity: tokenData.participantIdentity,
      participantName: tokenData.participantName,
      fallbackUrl
    });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    res.status(500).json({
      error: 'Failed to generate meeting token',
      available: false,
      provider: 'jitsi',
      fallbackUrl: `https://meet.jit.si/seniorconnect-session-${req.params.id}`
    });
  }
});

// ============================================
// FEEDBACK ROUTES
// ============================================

// Submit session feedback from either participant after the session is completed.
router.post('/sessions/:id/feedback', authenticate, async (req, res) => {
  try {
    const { rating, comment, tags } = req.body;
    
    if (!rating || !Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }
    
    const session = await prisma.sessionBooking.findFirst({
      where: {
        id: req.params.id,
        OR: [{ juniorId: req.user.id }, { seniorId: req.user.id }]
      }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.status !== 'completed') {
      return res.status(400).json({ error: 'Can only submit feedback for completed sessions' });
    }

    const cleanComment = comment ? String(comment).trim() : '';
    const cleanTags = Array.isArray(tags) ? tags.filter((tag) => tag && String(tag).trim()).map((tag) => String(tag).trim()) : [];
    const storedFeedback = session.feedback && typeof session.feedback === 'object' && !Array.isArray(session.feedback)
      ? session.feedback
      : {};

    if (session.seniorId === req.user.id) {
      if (storedFeedback.mentorFeedback) {
        return res.status(409).json({ error: 'Student feedback already submitted for this session' });
      }

      const mentorFeedback = {
        rating: Number(rating),
        comment: cleanComment,
        tags: cleanTags,
        submittedAt: new Date()
      };
      await prisma.sessionBooking.update({
        where: { id: req.params.id },
        data: { feedback: { ...storedFeedback, mentorFeedback } }
      });
      return res.status(201).json({ mentorFeedback });
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
        comment: cleanComment,
        tags: cleanTags
      }
    });
    
    // Store embedded feedback on the booking
    await prisma.sessionBooking.update({
      where: { id: req.params.id },
      data: {
        feedback: {
          ...storedFeedback,
          rating: Number(rating),
          comment: cleanComment,
          tags: cleanTags,
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

// ============================================
// NOTIFICATION ROUTES
// ============================================

// Create notification helper
const createNotification = async (userId, type, title, message, data = null) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data
      }
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

// Get user's notifications
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const { unreadOnly } = req.query;

    const where = { userId: req.user.id };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json(notifications);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    if (notification.type === 'session_reschedule_request') {
      return res.status(409).json({ error: 'Approve or reject this reschedule request before dismissing it.' });
    }

    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true }
    });

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/notifications/read-all', authenticate, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        isRead: false,
        NOT: { type: 'session_reschedule_request' }
      },
      data: { isRead: true }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Get notification count
router.get('/notifications/count', authenticate, async (req, res) => {
  try {
    const unreadCount = await prisma.notification.count({
      where: {
        userId: req.user.id,
        isRead: false
      }
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Fetch notification count error:', error);
    res.status(500).json({ error: 'Failed to fetch notification count' });
  }
});

// ============================================
// SESSION NOTES ROUTES
// ============================================

// Update session notes
router.put('/sessions/:id/notes', authenticate, async (req, res) => {
  try {
    const { notes } = req.body;

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

    const updatedSession = await prisma.sessionBooking.update({
      where: { id: req.params.id },
      data: { notes: notes || '' },
      include: {
        junior: { select: { id: true, name: true, avatar: true, university: true } },
        senior: { select: { id: true, name: true, avatar: true, title: true, company: true } }
      }
    });

    res.json(updatedSession);
  } catch (error) {
    console.error('Update session notes error:', error);
    res.status(500).json({ error: 'Failed to update session notes' });
  }
});

// ============================================
// RESCHEDULE ROUTES
// ============================================

const findRescheduleConflict = async (session, scheduledTime, duration) => {
  const newEnd = new Date(scheduledTime.getTime() + duration * 60000);
  const bookings = await prisma.sessionBooking.findMany({
    where: {
      id: { not: session.id },
      status: { in: ['pending', 'accepted', 'started'] },
      OR: [{ seniorId: session.seniorId }, { juniorId: session.juniorId }],
    },
    select: { seniorId: true, juniorId: true, scheduledTime: true, duration: true },
  });

  return bookings.some((booking) => {
    const bookingStart = new Date(booking.scheduledTime);
    const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60000);
    return dateOverlap(scheduledTime, newEnd, bookingStart, bookingEnd);
  });
};

// Reschedule session
router.put('/sessions/:id/reschedule', authenticate, async (req, res) => {
  try {
    const { scheduledTime, duration } = req.body;

    if (!scheduledTime) {
      return res.status(400).json({ error: 'scheduledTime is required' });
    }

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

    if (!['pending', 'accepted'].includes(session.status)) {
      return res.status(400).json({ error: 'Only pending or accepted sessions can be rescheduled' });
    }

    const newStart = new Date(scheduledTime);
    if (isNaN(newStart.getTime())) {
      return res.status(400).json({ error: 'Invalid scheduledTime' });
    }
    if (newStart <= new Date()) {
      return res.status(400).json({ error: 'Rescheduled time must be in the future' });
    }

    const dur = duration ? Math.min(Math.max(parseInt(duration, 10) || 45, 15), 120) : session.duration;
    if (await findRescheduleConflict(session, newStart, dur)) {
      return res.status(409).json({ error: 'A participant already has a session at this time' });
    }

    const otherUserId = req.user.id === session.juniorId ? session.seniorId : session.juniorId;
    if (session.status.toLowerCase() === 'accepted') {
      const pendingNotifications = await prisma.notification.findMany({
        where: { userId: otherUserId, type: 'session_reschedule_request', isRead: false },
        select: { data: true },
      });
      if (pendingNotifications.some((notification) => notification.data?.bookingId === session.id)) {
        return res.status(409).json({ error: 'A reschedule request is already awaiting approval' });
      }

      const requestData = {
        bookingId: session.id,
        requestedBy: req.user.id,
        newTime: newStart.toISOString(),
        duration: dur,
      };
      await createNotification(otherUserId, 'session_reschedule_request', 'Reschedule approval needed',
        'The other participant requested a new time. Approve or reject the request.', requestData);
      await createNotification(req.user.id, 'session_reschedule_pending', 'Reschedule requested',
        'The session time will stay unchanged until the other participant responds.', requestData);

      return res.status(202).json({ pendingApproval: true, session });
    }

    const updatedSession = await prisma.sessionBooking.update({
      where: { id: req.params.id },
      data: {
        scheduledTime: newStart,
        duration: dur
      },
      include: {
        junior: { select: { id: true, name: true, avatar: true, university: true } },
        senior: { select: { id: true, name: true, avatar: true, title: true, company: true } }
      }
    });

    await createNotification(
      otherUserId,
      'session_rescheduled',
      'Session Rescheduled',
      `Session has been rescheduled to ${newStart.toLocaleString()}`,
      { bookingId: session.id, newTime: newStart.toISOString() }
    );
    await createNotification(
      req.user.id,
      'session_rescheduled',
      'Session Reschedule Confirmed',
      `You rescheduled the session to ${newStart.toLocaleString()}`,
      { bookingId: session.id, newTime: newStart.toISOString() }
    );

    res.json(updatedSession);
  } catch (error) {
    console.error('Reschedule session error:', error);
    res.status(500).json({ error: 'Failed to reschedule session' });
  }
});

router.put('/sessions/:id/reschedule/decision', authenticate, async (req, res) => {
  try {
    const { decision } = req.body || {};
    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ error: "decision must be 'approve' or 'reject'" });
    }

    const session = await prisma.sessionBooking.findFirst({
      where: {
        id: req.params.id,
        OR: [{ juniorId: req.user.id }, { seniorId: req.user.id }],
      },
    });
    if (!session) return res.status(404).json({ error: 'Session not found or unauthorized' });

    const requesterId = req.user.id === session.juniorId ? session.seniorId : session.juniorId;
    const pendingNotifications = await prisma.notification.findMany({
      where: { userId: req.user.id, type: 'session_reschedule_request', isRead: false },
    });
    const requestNotification = pendingNotifications.find((notification) => notification.data?.bookingId === session.id);
    if (!requestNotification || requestNotification.data?.requestedBy !== requesterId) {
      return res.status(404).json({ error: 'Pending reschedule request not found' });
    }
    if (session.status.toLowerCase() !== 'accepted') {
      return res.status(409).json({ error: 'Only accepted sessions can use approval-based rescheduling' });
    }

    let updatedSession = session;
    if (decision === 'approve') {
      const newStart = new Date(requestNotification.data.newTime);
      const duration = Number(requestNotification.data.duration);
      if (!Number.isFinite(newStart.getTime()) || newStart <= new Date()) {
        return res.status(400).json({ error: 'Requested time has passed or is invalid' });
      }
      if (!Number.isInteger(duration) || duration < 15 || duration > 120) {
        return res.status(400).json({ error: 'Requested duration is invalid' });
      }
      if (await findRescheduleConflict(session, newStart, duration)) {
        return res.status(409).json({ error: 'A participant now has a session at the requested time' });
      }
      updatedSession = await prisma.sessionBooking.update({
        where: { id: session.id },
        data: { scheduledTime: newStart, duration },
        include: {
          junior: { select: { id: true, name: true, avatar: true, university: true } },
          senior: { select: { id: true, name: true, avatar: true, title: true, company: true } },
        },
      });
    }

    await prisma.notification.update({
      where: { id: requestNotification.id },
      data: { isRead: true },
    });
    const outcome = decision === 'approve' ? 'approved' : 'rejected';
    const outcomeData = { bookingId: session.id, decision, requestedBy: requesterId };
    await createNotification(requesterId, 'session_reschedule_result', 'Reschedule request updated',
      `The other participant ${outcome} your reschedule request.`, outcomeData);
    await createNotification(req.user.id, 'session_reschedule_result', 'Reschedule request updated',
      `You ${outcome} the reschedule request.`, outcomeData);

    return res.json({ decision, session: updatedSession });
  } catch (error) {
    console.error('Reschedule decision error:', error);
    return res.status(500).json({ error: 'Failed to process reschedule decision' });
  }
});

// ============================================
// ANALYTICS ROUTES
// ============================================

// Get session analytics for current user
router.get('/analytics', authenticate, async (req, res) => {
  try {
    const { role } = req.query;

    const sessions = await prisma.sessionBooking.findMany({
      where: {
        OR: [
          { juniorId: req.user.id },
          { seniorId: req.user.id }
        ]
      },
      include: {
        junior: {
          select: { id: true, name: true, avatar: true }
        },
        senior: {
          select: { id: true, name: true, avatar: true }
        },
        feedbacks: true
      },
      orderBy: { scheduledTime: 'desc' }
    });

    const userSessions = role === 'senior'
      ? sessions.filter(s => s.seniorId === req.user.id)
      : role === 'junior'
      ? sessions.filter(s => s.juniorId === req.user.id)
      : sessions;

    const totalSessions = userSessions.length;
    const completedSessions = userSessions.filter(s => s.status === 'completed').length;
    const pendingSessions = userSessions.filter(s => s.status === 'pending').length;
    const acceptedSessions = userSessions.filter(s => s.status === 'accepted').length;
    const cancelledSessions = userSessions.filter(s => s.status === 'cancelled').length;
    const rejectedSessions = userSessions.filter(s => s.status === 'rejected').length;

    const upcomingSessions = userSessions.filter(s =>
      ['pending', 'accepted'].includes(s.status) && new Date(s.scheduledTime) > new Date()
    );

    const averageDuration = totalSessions > 0
      ? userSessions.reduce((sum, s) => sum + s.duration, 0) / totalSessions
      : 0;

    const sessionsWithFeedback = userSessions.filter(s => s.feedbacks.length > 0);
    const averageRating = sessionsWithFeedback.length > 0
      ? sessionsWithFeedback.reduce((sum, s) => sum + s.feedbacks[0].rating, 0) / sessionsWithFeedback.length
      : 0;

    const sessionsByMonth = {};
    userSessions.forEach(session => {
      const month = new Date(session.scheduledTime).toISOString().slice(0, 7);
      if (!sessionsByMonth[month]) {
        sessionsByMonth[month] = { total: 0, completed: 0, cancelled: 0 };
      }
      sessionsByMonth[month].total++;
      if (session.status === 'completed') sessionsByMonth[month].completed++;
      if (session.status === 'cancelled') sessionsByMonth[month].cancelled++;
    });

    const recentSessions = userSessions.slice(0, 10);

    res.json({
      overview: {
        totalSessions,
        completedSessions,
        pendingSessions,
        acceptedSessions,
        cancelledSessions,
        rejectedSessions,
        upcomingSessions: upcomingSessions.length
      },
      metrics: {
        averageDuration: Math.round(averageDuration),
        averageRating: Math.round(averageRating * 10) / 10,
        completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
      },
      sessionsByMonth,
      recentSessions
    });
  } catch (error) {
    console.error('Fetch analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;