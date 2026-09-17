const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const AvailabilitySlot = require('../models/AvailabilitySlot');
const User = require('../models/User');
const { protect, requireRole } = require('../middleware/auth');

// ── GET /availability/:seniorId  (public – used on booking page) ──
router.get('/:seniorId', async (req, res, next) => {
  try {
    const senior = await User.findOne({ _id: req.params.seniorId, role: 'senior' });
    if (!senior) return res.status(404).json({ error: 'Senior not found' });

    const now = new Date();
    const slots = await AvailabilitySlot.find({
      seniorId: req.params.seniorId,
      startTime: { $gte: now },
    }).sort({ startTime: 1 });

    const formatted = slots.map((s) => ({
      id: s._id.toString(),
      date: s.startTime.toISOString().split('T')[0],
      time: s.startTime.toTimeString().slice(0, 5),
      available: !s.isBooked,
      startTime: s.startTime,
      endTime: s.endTime,
    }));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// ── POST /availability  (senior adds one or many slots) ───────
router.post(
  '/',
  protect,
  requireRole('senior'),
  [
    body('slots')
      .isArray({ min: 1 })
      .withMessage('slots must be a non-empty array'),
    body('slots.*.startTime')
      .isISO8601()
      .withMessage('Each slot must have a valid startTime'),
    body('slots.*.endTime')
      .isISO8601()
      .withMessage('Each slot must have a valid endTime'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const { slots } = req.body;

      const docs = slots.map((s) => ({
        seniorId: req.user._id,
        startTime: new Date(s.startTime),
        endTime: new Date(s.endTime),
        isBooked: false,
      }));

      const created = await AvailabilitySlot.insertMany(docs, { ordered: false });

      const formatted = created.map((s) => ({
        id: s._id.toString(),
        date: s.startTime.toISOString().split('T')[0],
        time: s.startTime.toTimeString().slice(0, 5),
        available: !s.isBooked,
      }));

      res.status(201).json(formatted);
    } catch (err) {
      next(err);
    }
  }
);

// ── DELETE /availability/:slotId  (senior removes a slot) ─────
router.delete('/:slotId', protect, requireRole('senior'), async (req, res, next) => {
  try {
    const slot = await AvailabilitySlot.findById(req.params.slotId);
    if (!slot) return res.status(404).json({ error: 'Slot not found' });

    if (slot.seniorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not your slot' });
    }
    if (slot.isBooked) {
      return res.status(409).json({ error: 'Cannot delete a booked slot' });
    }

    await slot.deleteOne();
    res.json({ message: 'Slot deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
