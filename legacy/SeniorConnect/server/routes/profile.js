const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const SeniorProfile = require('../models/SeniorProfile');
const { protect } = require('../middleware/auth');
const { updateCredibility } = require('../utils/credibility');

// ── GET /profile  (current user's full profile) ───────────────
router.get('/', protect, async (req, res, next) => {
  try {
    const user = req.user;
    let profile = null;

    if (user.role === 'senior') {
      profile = await SeniorProfile.findOne({ userId: user._id });
    }

    res.json({ user, profile });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /profile  (update common + role-specific fields) ────
router.patch(
  '/',
  protect,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('university').optional().trim(),
    body('year').optional().trim(),
    body('interests').optional().isArray(),
    body('goals').optional().isArray(),
    // Senior fields
    body('title').optional().trim(),
    body('company').optional().trim(),
    body('domain').optional().trim(),
    body('role').optional().trim(),
    body('bio').optional().trim(),
    body('experience').optional().isInt({ min: 0 }),
    body('location').optional().trim(),
    body('expertise').optional().isArray(),
    body('achievements').optional().isArray(),
    body('availability').optional().isIn(['available', 'limited', 'booked']),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const {
        name, university, year, interests, goals,
        title, company, domain, bio, experience, location,
        expertise, achievements, availability,
        role: seniorRole, // "role" in SeniorProfile means their tech role (Backend/Frontend/etc.)
      } = req.body;

      // Fields shared / applicable to User document
      const userUpdates = {};
      if (name !== undefined) userUpdates.name = name;
      if (university !== undefined) userUpdates.university = university;
      if (year !== undefined) userUpdates.year = year;
      if (interests !== undefined) userUpdates.interests = interests;
      if (goals !== undefined) userUpdates.goals = goals;
      if (title !== undefined) userUpdates.title = title;
      if (company !== undefined) userUpdates.company = company;
      if (location !== undefined) userUpdates.location = location;

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: userUpdates },
        { new: true, runValidators: true }
      );

      let updatedProfile = null;

      if (req.user.role === 'senior') {
        const profileUpdates = {};
        if (title !== undefined) profileUpdates.title = title;
        if (company !== undefined) profileUpdates.company = company;
        if (domain !== undefined) profileUpdates.domain = domain;
        if (seniorRole !== undefined) profileUpdates.role = seniorRole;
        if (bio !== undefined) profileUpdates.bio = bio;
        if (experience !== undefined) profileUpdates.experience = experience;
        if (location !== undefined) profileUpdates.location = location;
        if (expertise !== undefined) profileUpdates.expertise = expertise;
        if (achievements !== undefined) profileUpdates.achievements = achievements;
        if (availability !== undefined) profileUpdates.availability = availability;

        updatedProfile = await SeniorProfile.findOneAndUpdate(
          { userId: req.user._id },
          { $set: profileUpdates },
          { new: true, upsert: true }
        );
      }

      // Recalculate credibility after profile change
      await updateCredibility(req.user._id);

      res.json({ user: updatedUser, profile: updatedProfile });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
