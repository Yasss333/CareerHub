import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Get problem recommendations based on roadmap topics
async function getProblemRecommendationsForRoadmap(userId, roadmapId) {
  const roadmap = await prisma.roadmap.findUnique({
    where: { id: roadmapId },
    include: { milestones: true }
  })

  if (!roadmap) return []

  // Extract topics from roadmap
  const topics = roadmap.topics ? Object.values(roadmap.topics).flat() : []
  const milestoneTopics = roadmap.milestones.flatMap(m => {
    if (m.topics && Array.isArray(m.topics)) {
      return m.topics
    }
    return []
  })

  const allTopics = [...new Set([...topics, ...milestoneTopics])].filter(t => typeof t === 'string' && t.trim())

  // Find problems matching these topics
  const recommendedProblems = await prisma.problem.findMany({
    where: {
      tags: {
        hasSome: allTopics
      }
    },
    take: 10,
    orderBy: { createdAt: 'desc' }
  })

  return recommendedProblems
}

// Get resume skill suggestions based on roadmap
async function getResumeSkillSuggestions(userId, roadmapId) {
  const roadmap = await prisma.roadmap.findUnique({
    where: { id: roadmapId },
    include: { milestones: true }
  })

  if (!roadmap) return []

  // Extract skills from roadmap topics
  const topics = roadmap.topics ? Object.values(roadmap.topics).flat() : []
  const milestoneTopics = roadmap.milestones.flatMap(m => {
    if (m.topics && Array.isArray(m.topics)) {
      return m.topics
    }
    return []
  })

  const allTopics = [...new Set([...topics, ...milestoneTopics])]

  // Filter and format as skill suggestions
  const skillSuggestions = allTopics
    .filter(topic => typeof topic === 'string' && topic.length > 2)
    .slice(0, 20)

  return skillSuggestions
}

// Get mentor recommendations based on user goals and roadmap
async function getMentorRecommendations(userId, roadmapId) {
  const roadmap = await prisma.roadmap.findUnique({
    where: { id: roadmapId }
  })

  if (!roadmap) return []

  // Extract domain/expertise from roadmap
  const roleType = roadmap.roleType.toLowerCase()
  const skillLevel = roadmap.skillLevel

  // Find mentors matching the domain
  const mentors = await prisma.seniorProfile.findMany({
    where: {
      domain: {
        contains: roleType.split(' ')[0] // Match first word of role type
      },
      user: {
        mentorApprovalStatus: 'APPROVED'
      }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          title: true,
          company: true
        }
      }
    },
    take: 5,
    orderBy: { rating: 'desc' }
  })

  return mentors
}

// Get learning path suggestions based on user activity
async function getLearningPathSuggestions(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      resumes: true,
      interviewSessions: true,
      roadmaps: true,
      submissions: {
        include: {
          problem: true
        }
      }
    }
  })

  if (!user) return []

  const suggestions = []

  // Analyze solved problems to suggest related topics
  const solvedTags = user.submissions
    .filter(s => s.status === 'Accepted')
    .flatMap(s => s.problem?.tags || [])

  const tagFrequency = solvedTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1
    return acc
  }, {})

  const strongTags = Object.entries(tagFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag)

  // Suggest roadmaps based on strong areas
  if (strongTags.includes('arrays') || strongTags.includes('dynamic-programming')) {
    suggestions.push({
      type: 'roadmap',
      title: 'Advanced Data Structures',
      description: 'Deepen your understanding of complex data structures',
      roleType: 'Backend Developer'
    })
  }

  if (strongTags.includes('strings') || strongTags.includes('algorithms')) {
    suggestions.push({
      type: 'roadmap',
      title: 'Algorithm Mastery',
      description: 'Master fundamental and advanced algorithms',
      roleType: 'Backend Developer'
    })
  }

  // Suggest mentors based on solved topics
  if (strongTags.length > 0) {
    const topicMentors = await prisma.seniorProfile.findMany({
      where: {
        expertise: {
          hasSome: strongTags
        },
        user: {
          mentorApprovalStatus: 'APPROVED'
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      take: 3
    })

    topicMentors.forEach(mentor => {
      suggestions.push({
        type: 'mentor',
        title: `Connect with ${mentor.user.name}`,
        description: `Expert in ${mentor.expertise.slice(0, 3).join(', ')}`,
        mentorId: mentor.user.id
      })
    })
  }

  return suggestions
}

// Get cross-module insights for dashboard
async function getCrossModuleInsights(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      totalProblemsSolved: true,
      currentStreak: true,
      acceptanceRate: true,
      resumes: {
        select: { id: true, skills: true }
      },
      interviewSessions: {
        where: { status: 'completed' },
        select: { feedback: true }
      },
      roadmaps: {
        select: { progress: true, roleType: true }
      }
    }
  })

  if (!user) return []

  const insights = []

  // AlgoRank insight
  if (user.totalProblemsSolved > 0) {
    const acceptanceRate = user.acceptanceRate * 100
    insights.push({
      type: 'algorank',
      title: 'Problem Solving Progress',
      description: `You've solved ${user.totalProblemsSolved} problems with ${acceptanceRate.toFixed(1)}% acceptance rate`,
      action: 'Practice more',
      link: '/algorank'
    })
  }

  // Resume insight
  if (user.resumes.length > 0) {
    const resumeSkills = user.resumes.flatMap(r => r.skills || [])
    if (resumeSkills.length > 0) {
      insights.push({
        type: 'resume',
        title: 'Resume Skills',
        description: `Your resume highlights ${resumeSkills.length} key skills`,
        action: 'Update resume',
        link: '/resume'
      })
    }
  }

  // Interview insight
  if (user.interviewSessions.length > 0) {
    const avgScore = user.interviewSessions.reduce((sum, s) => {
      return sum + (s.feedback?.overallScore || 0)
    }, 0) / user.interviewSessions.length

    insights.push({
      type: 'interview',
      title: 'Interview Performance',
      description: `Average score: ${avgScore.toFixed(0)}% across ${user.interviewSessions.length} interviews`,
      action: 'Practice more',
      link: '/interview'
    })
  }

  // Roadmap insight
  if (user.roadmaps.length > 0) {
    const avgProgress = user.roadmaps.reduce((sum, r) => sum + r.progress, 0) / user.roadmaps.length
    insights.push({
      type: 'roadmap',
      title: 'Learning Progress',
      description: `Average ${avgProgress.toFixed(0)}% completion across ${user.roadmaps.length} roadmaps`,
      action: 'Continue learning',
      link: '/roadmaps'
    })
  }

  return insights
}

export {
  getProblemRecommendationsForRoadmap,
  getResumeSkillSuggestions,
  getMentorRecommendations,
  getLearningPathSuggestions,
  getCrossModuleInsights
}
