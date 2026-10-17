import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ACHIEVEMENT_DEFINITIONS = {
  // AlgoRank achievements
  algorank_first_solve: {
    title: 'First Steps',
    description: 'Solve your first problem',
    icon: '🎯'
  },
  algorank_streak_3: {
    title: 'Hot Streak',
    description: 'Maintain a 3-day solving streak',
    icon: '🔥'
  },
  algorank_streak_7: {
    title: 'On Fire',
    description: 'Maintain a 7-day solving streak',
    icon: '💪'
  },
  algorank_streak_30: {
    title: 'Unstoppable',
    description: 'Maintain a 30-day solving streak',
    icon: '🏆'
  },
  algorank_10_problems: {
    title: 'Getting Started',
    description: 'Solve 10 problems',
    icon: '📈'
  },
  algorank_50_problems: {
    title: 'Problem Solver',
    description: 'Solve 50 problems',
    icon: '🎓'
  },
  algorank_100_problems: {
    title: 'Master',
    description: 'Solve 100 problems',
    icon: '👑'
  },
  algorank_top_100: {
    title: 'Elite',
    description: 'Reach top 100 on leaderboard',
    icon: '⭐'
  },

  // Resume Builder achievements
  resume_created: {
    title: 'Profile Builder',
    description: 'Create your first resume',
    icon: '📄'
  },
  resume_published: {
    title: 'Public Figure',
    description: 'Publish your resume',
    icon: '🌟'
  },
  resume_ai_enhanced: {
    title: 'AI Assisted',
    description: 'Use AI to enhance your resume',
    icon: '🤖'
  },

  // Senior Connect achievements
  session_completed: {
    title: 'First Session',
    description: 'Complete your first mentorship session',
    icon: '🤝'
  },
  session_5_completed: {
    title: 'Mentorship Enthusiast',
    description: 'Complete 5 mentorship sessions',
    icon: '🎓'
  },
  session_mentor_approved: {
    title: 'Trusted Mentor',
    description: 'Get approved as a mentor',
    icon: '🏅'
  },
  session_5_star_rating: {
    title: 'Excellent Mentor',
    description: 'Receive a 5-star rating as a mentor',
    icon: '⭐'
  },

  // AI Interview achievements
  interview_completed: {
    title: 'Interview Practice',
    description: 'Complete your first mock interview',
    icon: '🎙️'
  },
  interview_perfect_score: {
    title: 'Perfect Performance',
    description: 'Get a perfect score on an interview',
    icon: '💯'
  },
  interview_5_completed: {
    title: 'Interview Pro',
    description: 'Complete 5 mock interviews',
    icon: '🎭'
  },

  // Roadmap achievements
  roadmap_created: {
    title: 'Path Finder',
    description: 'Create your first learning roadmap',
    icon: '🗺️'
  },
  roadmap_milestone_completed: {
    title: 'First Milestone',
    description: 'Complete your first roadmap milestone',
    icon: '📍'
  },
  roadmap_completed: {
    title: 'Graduate',
    description: 'Complete an entire roadmap',
    icon: '🎓'
  }
}

async function checkAndUnlockAchievement(userId, achievementType) {
  const definition = ACHIEVEMENT_DEFINITIONS[achievementType]
  if (!definition) return null

  // Check if already unlocked
  const existing = await prisma.achievement.findUnique({
    where: {
      userId_type: {
        userId,
        type: achievementType
      }
    }
  })

  if (existing) return existing

  // Unlock the achievement
  const achievement = await prisma.achievement.create({
    data: {
      userId,
      type: achievementType,
      title: definition.title,
      description: definition.description,
      icon: definition.icon
    }
  })

  return achievement
}

async function getUserAchievements(userId) {
  const achievements = await prisma.achievement.findMany({
    where: { userId },
    orderBy: { unlockedAt: 'desc' }
  })

  return achievements
}

async function checkAlgoRankAchievements(userId, userStats) {
  const achievements = []

  // First solve
  if (userStats.totalProblemsSolved >= 1) {
    achievements.push(await checkAndUnlockAchievement(userId, 'algorank_first_solve'))
  }

  // Streak achievements
  if (userStats.currentStreak >= 3) {
    achievements.push(await checkAndUnlockAchievement(userId, 'algorank_streak_3'))
  }
  if (userStats.currentStreak >= 7) {
    achievements.push(await checkAndUnlockAchievement(userId, 'algorank_streak_7'))
  }
  if (userStats.currentStreak >= 30) {
    achievements.push(await checkAndUnlockAchievement(userId, 'algorank_streak_30'))
  }

  // Problem count achievements
  if (userStats.totalProblemsSolved >= 10) {
    achievements.push(await checkAndUnlockAchievement(userId, 'algorank_10_problems'))
  }
  if (userStats.totalProblemsSolved >= 50) {
    achievements.push(await checkAndUnlockAchievement(userId, 'algorank_50_problems'))
  }
  if (userStats.totalProblemsSolved >= 100) {
    achievements.push(await checkAndUnlockAchievement(userId, 'algorank_100_problems'))
  }

  return achievements.filter(Boolean)
}

async function checkResumeAchievements(userId, resumeCount, hasPublished, hasAIEnhanced) {
  const achievements = []

  if (resumeCount >= 1) {
    achievements.push(await checkAndUnlockAchievement(userId, 'resume_created'))
  }
  if (hasPublished) {
    achievements.push(await checkAndUnlockAchievement(userId, 'resume_published'))
  }
  if (hasAIEnhanced) {
    achievements.push(await checkAndUnlockAchievement(userId, 'resume_ai_enhanced'))
  }

  return achievements.filter(Boolean)
}

async function checkSessionAchievements(userId, sessionCount, isMentor, hasFiveStarRating) {
  const achievements = []

  if (sessionCount >= 1) {
    achievements.push(await checkAndUnlockAchievement(userId, 'session_completed'))
  }
  if (sessionCount >= 5) {
    achievements.push(await checkAndUnlockAchievement(userId, 'session_5_completed'))
  }
  if (isMentor) {
    achievements.push(await checkAndUnlockAchievement(userId, 'session_mentor_approved'))
  }
  if (hasFiveStarRating) {
    achievements.push(await checkAndUnlockAchievement(userId, 'session_5_star_rating'))
  }

  return achievements.filter(Boolean)
}

async function checkInterviewAchievements(userId, interviewCount, hasPerfectScore) {
  const achievements = []

  if (interviewCount >= 1) {
    achievements.push(await checkAndUnlockAchievement(userId, 'interview_completed'))
  }
  if (hasPerfectScore) {
    achievements.push(await checkAndUnlockAchievement(userId, 'interview_perfect_score'))
  }
  if (interviewCount >= 5) {
    achievements.push(await checkAndUnlockAchievement(userId, 'interview_5_completed'))
  }

  return achievements.filter(Boolean)
}

async function checkRoadmapAchievements(userId, roadmapCount, completedMilestones, completedRoadmaps) {
  const achievements = []

  if (roadmapCount >= 1) {
    achievements.push(await checkAndUnlockAchievement(userId, 'roadmap_created'))
  }
  if (completedMilestones >= 1) {
    achievements.push(await checkAndUnlockAchievement(userId, 'roadmap_milestone_completed'))
  }
  if (completedRoadmaps >= 1) {
    achievements.push(await checkAndUnlockAchievement(userId, 'roadmap_completed'))
  }

  return achievements.filter(Boolean)
}

export {
  checkAndUnlockAchievement,
  getUserAchievements,
  checkAlgoRankAchievements,
  checkResumeAchievements,
  checkSessionAchievements,
  checkInterviewAchievements,
  checkRoadmapAchievements,
  ACHIEVEMENT_DEFINITIONS
}
