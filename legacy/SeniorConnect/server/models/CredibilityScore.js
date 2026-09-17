const mongoose = require('mongoose');

const credibilityScoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    sessionsAttended: { type: Number, default: 0 },
    feedbackScore: { type: Number, default: 0 }, // avg rating 0-5
    consistencyScore: { type: Number, default: 0 }, // sessions in last 30 days
    profileCompleteness: { type: Number, default: 0 }, // 0-100 %
    computedScore: { type: Number, default: 0, min: 0, max: 100 },
    badge: {
      type: String,
      enum: [
        'New Member',
        'Active Learner',
        'Trusted Junior',
        'Consistent Participant',
        'High-Engagement User',
      ],
      default: 'New Member',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CredibilityScore', credibilityScoreSchema);
