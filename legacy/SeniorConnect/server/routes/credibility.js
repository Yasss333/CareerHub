const router = require('express').Router();
const CredibilityScore = require('../models/CredibilityScore');
const { protect } = require('../middleware/auth');
const { updateCredibility } = require('../utils/credibility');

// ── GET /credibility  (current user's credibility record) ─────
router.get('/', protect, async (req, res, next) => {
  try {
    // Recompute on read so the response is always fresh
    const doc = await updateCredibility(req.user._id);
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// ── GET /credibility/:userId  (any user's credibility – public) ──
router.get('/:userId', async (req, res, next) => {
  try {
    const doc = await CredibilityScore.findOne({ userId: req.params.userId });
    if (!doc) return res.status(404).json({ error: 'Credibility record not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
