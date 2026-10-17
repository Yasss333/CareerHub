import express from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { getUserAchievements, checkAlgoRankAchievements, checkResumeAchievements, checkSessionAchievements, checkInterviewAchievements, checkRoadmapAchievements } from '../services/achievement.service.js'

const router = express.Router()
const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'careerhub-super-secret-jwt-key-2024'

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'Authentication required' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    return next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// Get user's achievements
router.get('/', authenticate, async (req, res) => {
  try {
    const achievements = await getUserAchievements(req.user.id)
    res.json({ achievements })
  } catch (error) {
    console.error('Get achievements failed:', error)
    res.status(500).json({ error: 'Could not load achievements' })
  }
})

// Check and unlock achievements (triggered by user actions)
router.post('/check', authenticate, async (req, res) => {
  try {
    const { type } = req.body
    if (!type) return res.status(400).json({ error: 'Achievement type required' })

    // Get user stats for achievement checking
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        totalProblemsSolved: true,
        currentStreak: true,
        rankingScore: true,
        acceptanceRate: true
      }
    })

    if (!user) return res.status(404).json({ error: 'User not found' })

    let newAchievements = []

    // Check achievements based on type
    if (type === 'algorank') {
      newAchievements = await checkAlgoRankAchievements(req.user.id, user)
    } else if (type === 'resume') {
      const resumes = await prisma.resume.findMany({
        where: { userId: req.user.id },
        select: { public: true }
      })
      const hasPublished = resumes.some(r => r.public)
      newAchievements = await checkResumeAchievements(req.user.id, resumes.length, hasPublished, false)
    } else if (type === 'session') {
      const sessions = await prisma.sessionBooking.findMany({
        where: {
          OR: [{ juniorId: req.user.id }, { seniorId: req.user.id }],
          status: 'completed'
        }
      })
      const isMentor = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { role: true }
      }).then(u => u?.role === 'MENTOR')
      newAchievements = await checkSessionAchievements(req.user.id, sessions.length, isMentor, false)
    } else if (type === 'interview') {
      const interviews = await prisma.interviewSession.findMany({
        where: { userId: req.user.id, status: 'completed' }
      })
      const hasPerfectScore = interviews.some(i => (i.feedback?.overallScore || 0) >= 100)
      newAchievements = await checkInterviewAchievements(req.user.id, interviews.length, hasPerfectScore)
    } else if (type === 'roadmap') {
      const roadmaps = await prisma.roadmap.findMany({
        where: { userId: req.user.id },
        include: { milestones: true }
      })
      const completedMilestones = roadmaps.reduce((sum, r) => sum + r.milestones.filter(m => m.isCompleted).length, 0)
      const completedRoadmaps = roadmaps.filter(r => r.progress === 100).length
      newAchievements = await checkRoadmapAchievements(req.user.id, roadmaps.length, completedMilestones, completedRoadmaps)
    }

    res.json({ achievements: newAchievements.filter(Boolean) })
  } catch (error) {
    console.error('Check achievements failed:', error)
    res.status(500).json({ error: 'Could not check achievements' })
  }
})

export default router
