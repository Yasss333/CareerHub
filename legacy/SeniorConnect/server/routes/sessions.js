const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const SessionBooking = require('../models/SessionBooking');
const SessionFeedback = require('../models/SessionFeedback');
const AvailabilitySlot = require('../models/AvailabilitySlot');
const SeniorProfile = require('../models/SeniorProfile');
const User = require('../models/User');
const { protect, requireRole } = require('../middleware/auth');
const { updateCredibility } = require('../utils/credibility');

/** Shape a SessionBooking document into the frontend Session type */
async function formatSession(booking) {
  const senior = await User.findById(booking.seniorId).select('name avatar title company');
  const junior = await User.findById(booking.juniorId).select('name');

  const d = new Date(booking.scheduledTime);
  return {
    id: booking._id.toString(),
    seniorId: booking.seniorId.toString(),
    seniorName: senior?.name || '',
    seniorAvatar: senior?.avatar || '',
    juniorName: junior?.name || '',
    date: d.toISOString().split('T')[0],
    time: d.toTimeString().slice(0, 5),
    duration: booking.duration,
    topic: booking.topic,
    notes: booking.notes || '',
    status: booking.status,
    meetingLink: booking.jitsiRoomUrl || '',
    jitsiRoomName: booking.jitsiRoomName || '',
    hasFeedback: !!booking.feedback?.rating,
    feedback: booking.feedback?.rating ? booking.feedback : null,
  };
}

// ── POST /sessions  (junior books a session) ──────────────────
router.post(
  '/',
  protect,
  requireRole('junior'),
  [
    body('seniorId').notEmpty().withMessage('seniorId is required'),
    body('scheduledTime').isISO8601().withMessage('scheduledTime must be a valid ISO date'),
    body('duration').isInt({ min: 15, max: 120 }).withMessage('duration must be 15-120 minutes'),
    body('topic').trim().notEmpty().withMessage('topic is required'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const { seniorId, scheduledTime, duration, topic, notes, availabilitySlotId } = req.body;

      // Prevent mentor from booking themselves
      if (req.user._id.toString() === seniorId) {
        return res.status(403).json({ error: 'You cannot book a session with yourself' });
      }

      // Ensure senior exists
      const senior = await User.findOne({ _id: seniorId, role: 'senior' });
      if (!senior) return res.status(404).json({ error: 'Senior not found' });

      // Mark the slot as booked if provided
      if (availabilitySlotId) {
        const slot = await AvailabilitySlot.findOne({ _id: availabilitySlotId, seniorId, isBooked: false });
        if (!slot) return res.status(409).json({ error: 'Slot is no longer available' });
        await AvailabilitySlot.findByIdAndUpdate(availabilitySlotId, { isBooked: true });
      }

      // Create the booking with pending status (requires admin/mentor approval)
      const booking = await SessionBooking.create({
        juniorId: req.user._id,
        seniorId,
        availabilitySlotId: availabilitySlotId || null,
        scheduledTime: new Date(scheduledTime),
        duration,
        topic,
        notes: notes || '',
        status: 'pending', // Changed from 'upcoming' to 'pending' for approval workflow
        dailyRoomName: null, // Room will be created when approved
        dailyRoomUrl: null,
      });

      const formatted = await formatSession(booking);
      res.status(201).json(formatted);
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /sessions  (current user's sessions) ─────────────────
router.get('/', protect, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const isJunior = req.user.role === 'junior';

    const filter = isJunior ? { juniorId: userId } : { seniorId: userId };
    const bookings = await SessionBooking.find(filter).sort({ scheduledTime: -1 });

    const formatted = await Promise.all(bookings.map(formatSession));
    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /sessions/:id  (update status) ─────────────────────
// Junior can cancel. Senior can accept / reject / complete / start meeting.
router.patch(
  '/:id',
  protect,
  [
    body('status')
      .isIn(['accepted', 'rejected', 'completed', 'cancelled', 'upcoming', 'started'])
      .withMessage('Invalid status value'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const booking = await SessionBooking.findById(req.params.id);
      if (!booking) return res.status(404).json({ error: 'Session not found' });

      const userId = req.user._id.toString();
      const isJunior = req.user.role === 'junior';
      const isSenior = req.user.role === 'senior';

      // Ownership check
      const ownsSession =
        booking.juniorId.toString() === userId || booking.seniorId.toString() === userId;
      if (!ownsSession) return res.status(403).json({ error: 'Not authorised' });

      const { status } = req.body;

      // Role-based status guards
      if (isJunior && !['cancelled'].includes(status)) {
        return res.status(403).json({ error: 'Juniors can only cancel sessions' });
      }
      if (isSenior && !['accepted', 'rejected', 'completed', 'started'].includes(status)) {
        return res.status(403).json({ error: 'Invalid status for senior' });
      }

      // Workflow validation
      if (status === 'accepted' && booking.status !== 'pending') {
        return res.status(400).json({ error: 'Can only accept pending sessions' });
      }
      if (status === 'rejected' && booking.status !== 'pending') {
        return res.status(400).json({ error: 'Can only reject pending sessions' });
      }
      if (status === 'started' && booking.status !== 'accepted') {
        return res.status(400).json({ error: 'Session must be accepted before starting' });
      }

      // When mentor accepts session, create the Jitsi meeting room
      if (status === 'accepted' && !booking.jitsiRoomUrl) {
        const roomName = `seniorconnect-session-${booking._id}`;
        const jitsiRoomUrl = `https://meet.jit.si/${roomName}`;
        booking.jitsiRoomName = roomName;
        booking.jitsiRoomUrl = jitsiRoomUrl;
      }

      booking.status = status;
      await booking.save();

      // If completed, update credibility for both participants
      if (status === 'completed') {
        await Promise.all([
          updateCredibility(booking.juniorId),
          updateCredibility(booking.seniorId),
        ]);

        // Increment senior sessionCount
        await SeniorProfile.findOneAndUpdate(
          { userId: booking.seniorId },
          { $inc: { sessionCount: 1 } }
        );
      }

      // If cancelled or rejected, free the availability slot
      if ((status === 'cancelled' || status === 'rejected') && booking.availabilitySlotId) {
        await AvailabilitySlot.findByIdAndUpdate(booking.availabilitySlotId, { isBooked: false });
      }

      const formatted = await formatSession(booking);
      res.json(formatted);
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /sessions/:id/feedback  (junior submits feedback) ────
router.post(
  '/:id/feedback',
  protect,
  requireRole('junior'),
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    body('comment').trim().notEmpty().withMessage('Comment is required'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const booking = await SessionBooking.findById(req.params.id);
      if (!booking) return res.status(404).json({ error: 'Session not found' });

      if (booking.juniorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not your session' });
      }
      if (booking.status !== 'completed') {
        return res.status(400).json({ error: 'Can only review completed sessions' });
      }
      if (booking.feedback?.rating) {
        return res.status(409).json({ error: 'Feedback already submitted' });
      }

      const { rating, comment, tags } = req.body;

      // Embed feedback in session document
      booking.feedback = { rating, comment, tags: tags || [], submittedAt: new Date() };
      await booking.save();

      // Persist standalone feedback document
      await SessionFeedback.create({
        sessionId: booking._id,
        juniorId: booking.juniorId,
        seniorId: booking.seniorId,
        rating,
        comment,
        tags: tags || [],
      });

      // Recompute senior's aggregate rating from all their feedback
      const agg = await SessionFeedback.aggregate([
        { $match: { seniorId: booking.seniorId } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);
      if (agg.length > 0) {
        await SeniorProfile.findOneAndUpdate(
          { userId: booking.seniorId },
          {
            rating: Math.round(agg[0].avg * 10) / 10,
            reviewCount: agg[0].count,
          }
        );
      }

      // Update credibility for both users
      await Promise.all([
        updateCredibility(booking.juniorId),
        updateCredibility(booking.seniorId),
      ]);

      res.json({ message: 'Feedback submitted', feedback: booking.feedback });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
