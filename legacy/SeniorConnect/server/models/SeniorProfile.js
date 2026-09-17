const mongoose = require('mongoose');

const seniorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    title: { type: String, trim: true, default: '' },
    company: { type: String, trim: true, default: '' },
    domain: { type: String, trim: true, default: '' },
    role: { type: String, trim: true, default: '' },
    bio: { type: String, trim: true, default: '' },
    experience: { type: Number, default: 0 },
    location: { type: String, trim: true, default: '' },
    expertise: [{ type: String, trim: true }],
    achievements: [{ type: String, trim: true }],
    // Aggregated stats (kept denormalised for fast reads)
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    sessionCount: { type: Number, default: 0 },
    availability: {
      type: String,
      enum: ['available', 'limited', 'booked'],
      default: 'available',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SeniorProfile', seniorProfileSchema);
