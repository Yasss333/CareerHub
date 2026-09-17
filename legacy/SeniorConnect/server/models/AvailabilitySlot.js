const mongoose = require('mongoose');

const availabilitySlotSchema = new mongoose.Schema(
  {
    seniorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Ensure slots don't overlap for the same senior
availabilitySlotSchema.index({ seniorId: 1, startTime: 1 });

module.exports = mongoose.model('AvailabilitySlot', availabilitySlotSchema);
