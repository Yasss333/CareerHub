const mongoose = require('mongoose');

const sessionBookingSchema = new mongoose.Schema(
  {
    juniorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seniorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    availabilitySlotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AvailabilitySlot',
      default: null,
    },
    scheduledTime: {
      type: Date,
      required: [true, 'Scheduled time is required'],
    },
    duration: {
      type: Number, // minutes
      required: true,
      default: 45,
    },
    topic: {
      type: String,
      required: [true, 'Session topic is required'],
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'upcoming', 'completed', 'cancelled', 'started'],
      default: 'pending',
    },
    // Jitsi meeting room
    jitsiRoomName: { type: String, default: '' },
    jitsiRoomUrl: { type: String, default: '' },
    // Feedback embedded (one per session from junior)
    feedback: {
      rating: { type: Number, min: 1, max: 5, default: null },
      comment: { type: String, trim: true, default: '' },
      tags: [{ type: String }],
      submittedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

sessionBookingSchema.index({ juniorId: 1, createdAt: -1 });
sessionBookingSchema.index({ seniorId: 1, createdAt: -1 });

module.exports = mongoose.model('SessionBooking', sessionBookingSchema);
