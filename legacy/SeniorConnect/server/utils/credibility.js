const CredibilityScore = require('../models/CredibilityScore');
const SessionBooking = require('../models/SessionBooking');
const User = require('../models/User');

/**
 * Compute profile-completeness % for a user document.
 */
function computeProfileCompleteness(user) {
  const fields = [
    user.name,
    user.email,
    user.avatar,
    user.role === 'junior' ? user.university : user.company,
    user.role === 'junior' ? user.year : user.title,
    user.interests?.length || user.role === 'senior',
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

/**
 * Assign a badge name based on computed score (0-100).
 */
function assignBadge(score) {
  if (score >= 85) return 'High-Engagement User';
  if (score >= 70) return 'Consistent Participant';
  if (score >= 50) return 'Trusted Junior';
  if (score >= 25) return 'Active Learner';
  return 'New Member';
}

/**
 * Recompute and persist the credibility record for a user.
 * Call this after: session completed, feedback submitted, profile updated.
 */
async function updateCredibility(userId) {
  const user = await User.findById(userId);
  if (!user) return;

  // Sessions attended (completed)
  const sessionsAttended = await SessionBooking.countDocuments({
    $or: [{ juniorId: userId }, { seniorId: userId }],
    status: 'completed',
  });

  // Consistency: sessions completed in last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentSessions = await SessionBooking.countDocuments({
    $or: [{ juniorId: userId }, { seniorId: userId }],
    status: 'completed',
    updatedAt: { $gte: thirtyDaysAgo },
  });
  // Normalise to 0-10 (capped)
  const consistencyScore = Math.min(recentSessions, 10);

  // Average feedback rating given/received
  const feedbackAgg = await SessionBooking.aggregate([
    {
      $match: {
        $or: [{ juniorId: userId }, { seniorId: userId }],
        'feedback.rating': { $ne: null },
      },
    },
    { $group: { _id: null, avg: { $avg: '$feedback.rating' } } },
  ]);
  const feedbackScore = feedbackAgg[0]?.avg ?? 0; // 0-5

  // Profile completeness
  const profileCompleteness = computeProfileCompleteness(user);

  // Weighted score (out of 100)
  // sessions (40 pts max, each = 2 pts, cap 20 sessions)
  // feedback (30 pts max, rating/5 * 30)
  // consistency (15 pts max, score/10 * 15)
  // profile (15 pts max, completeness/100 * 15)
  const sessionPts = Math.min(sessionsAttended * 2, 40);
  const feedbackPts = (feedbackScore / 5) * 30;
  const consistencyPts = (consistencyScore / 10) * 15;
  const profilePts = (profileCompleteness / 100) * 15;
  const computedScore = Math.round(sessionPts + feedbackPts + consistencyPts + profilePts);

  const badge = assignBadge(computedScore);

  // Upsert the credibility document
  const doc = await CredibilityScore.findOneAndUpdate(
    { userId },
    {
      sessionsAttended,
      feedbackScore: Math.round(feedbackScore * 10) / 10,
      consistencyScore,
      profileCompleteness,
      computedScore,
      badge,
    },
    { upsert: true, new: true }
  );

  // Keep the denormalised score on the User document too
  await User.findByIdAndUpdate(userId, {
    credibilityScore: computedScore,
    badges: [badge],
  });

  return doc;
}

module.exports = { updateCredibility, assignBadge, computeProfileCompleteness };
