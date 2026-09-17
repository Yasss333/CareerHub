const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const SeniorProfile = require('../models/SeniorProfile');
const CredibilityScore = require('../models/CredibilityScore');

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// ── POST /auth/signup ─────────────────────────────────────────
router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').isIn(['junior', 'senior']).withMessage('Role must be junior or senior'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      const { name, email, password, role, company, title, university, year } = req.body;

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ error: 'Email already in use' });
      }

      // Build avatar URL from DiceBear
      const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=0d9488&textColor=ffffff&fontWeight=600`;

      const user = await User.create({
        name,
        email,
        passwordHash: password, // pre-save hook hashes it
        role,
        avatar,
        company: company || '',
        title: title || '',
        university: university || '',
        year: year || '',
      });

      // If senior, create SeniorProfile document
      if (role === 'senior') {
        await SeniorProfile.create({
          userId: user._id,
          company: company || '',
          title: title || '',
        });
      }

      // Bootstrap credibility record
      await CredibilityScore.create({ userId: user._id });

      const token = signToken(user._id);
      res.status(201).json({ token, user });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /auth/login ──────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      // Explicitly select passwordHash (excluded by default)
      const user = await User.findOne({ email }).select('+passwordHash');
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const valid = await user.verifyPassword(password);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = signToken(user._id);
      // Strip hash before sending
      const userObj = user.toJSON();
      res.json({ token, user: userObj });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
