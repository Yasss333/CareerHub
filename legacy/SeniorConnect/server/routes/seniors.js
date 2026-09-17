const router = require('express').Router();
const User = require('../models/User');
const SeniorProfile = require('../models/SeniorProfile');
const SessionFeedback = require('../models/SessionFeedback');
const AvailabilitySlot = require('../models/AvailabilitySlot');
const { protect } = require('../middleware/auth');

/**
 * Build a rich senior object that matches the frontend Senior type.
 * Merges User + SeniorProfile + availability slots.
 */
async function buildSeniorResponse(user, profile) {
  // Upcoming available slots (next 14 days)
  const now = new Date();
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const slots = await AvailabilitySlot.find({
    seniorId: user._id,
    startTime: { $gte: now, $lte: twoWeeks },
  }).sort({ startTime: 1 });

  const formattedSlots = slots.map((s) => ({
    id: s._id.toString(),
    date: s.startTime.toISOString().split('T')[0],
    time: s.startTime.toTimeString().slice(0, 5),
    available: !s.isBooked,
  }));

  return {
    id: user._id.toString(),
    name: user.name,
    avatar: user.avatar,
    credibilityScore: user.credibilityScore,
    badges: user.badges,
    title: profile?.title || user.title || '',
    company: profile?.company || user.company || '',
    domain: profile?.domain || '',
    role: profile?.role || '',
    bio: profile?.bio || '',
    experience: profile?.experience || 0,
    location: profile?.location || user.location || '',
    expertise: profile?.expertise || [],
    achievements: profile?.achievements || [],
    rating: profile?.rating || 0,
    reviewCount: profile?.reviewCount || 0,
    sessionCount: profile?.sessionCount || 0,
    availability: profile?.availability || 'available',
    slots: formattedSlots,
  };
}

// ── GET /seniors ──────────────────────────────────────────────
// Public. Supports query filters: role, company, domain, skills, availability, credibility
router.get('/', async (req, res, next) => {
  try {
    const { role, company, domain, skills, availability, credibility, search } = req.query;

    // Build SeniorProfile filter
    const profileFilter = {};
    if (role) profileFilter.role = { $regex: role, $options: 'i' };
    if (company) profileFilter.company = { $regex: company, $options: 'i' };
    if (domain) profileFilter.domain = { $regex: domain, $options: 'i' };
    if (availability) profileFilter.availability = availability;
    if (skills) {
      const skillList = Array.isArray(skills) ? skills : skills.split(',');
      profileFilter.expertise = { $in: skillList.map((s) => new RegExp(s.trim(), 'i')) };
    }

    const profiles = await SeniorProfile.find(profileFilter);
    const userIds = profiles.map((p) => p.userId);

    // Build User filter
    const userFilter = { role: 'senior', _id: { $in: userIds } };
    if (credibility) userFilter.credibilityScore = { $gte: Number(credibility) };
    if (search) userFilter.name = { $regex: search, $options: 'i' };

    const users = await User.find(userFilter).sort({ credibilityScore: -1 });

    const profileMap = {};
    profiles.forEach((p) => { profileMap[p.userId.toString()] = p; });

    const results = await Promise.all(
      users.map((u) => buildSeniorResponse(u, profileMap[u._id.toString()]))
    );

    res.json(results);
  } catch (err) {
    next(err);
  }
});

// ── GET /seniors/:id ──────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'senior' });
    if (!user) return res.status(404).json({ error: 'Senior not found' });

    const profile = await SeniorProfile.findOne({ userId: user._id });
    const senior = await buildSeniorResponse(user, profile);

    // Recent reviews (last 10 feedback docs for this senior)
    const feedbackDocs = await SessionFeedback.find({ seniorId: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('juniorId', 'name avatar');

    const reviews = feedbackDocs.map((f) => ({
      id: f._id.toString(),
      seniorId: user._id.toString(),
      juniorName: f.juniorId?.name || 'Anonymous',
      juniorAvatar: f.juniorId?.avatar || '',
      rating: f.rating,
      date: f.createdAt.toISOString().split('T')[0],
      comment: f.comment,
    }));

    res.json({ ...senior, reviews });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
