import express from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import {
  getProblemRecommendationsForRoadmap,
  getResumeSkillSuggestions,
  getMentorRecommendations,
  getLearningPathSuggestions,
  getCrossModuleInsights
} from '../services/recommendation.service.js'

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

const requireOwnedRoadmap = async (req, res, next) => {
  try {
    const roadmap = await prisma.roadmap.findFirst({ where: { id: req.params.roadmapId, userId: req.user.id }, select: { id: true } })
    if (!roadmap) return res.status(404).json({ error: 'Roadmap not found' })
    return next()
  } catch { return res.status(500).json({ error: 'Could not verify roadmap access' }) }
}

// Get problem recommendations for a roadmap
router.get('/problems/:roadmapId', authenticate, requireOwnedRoadmap, async (req, res) => {
  try {
    const problems = await getProblemRecommendationsForRoadmap(req.user.id, req.params.roadmapId)
    res.json({ problems })
  } catch (error) {
    console.error('Get problem recommendations failed:', error)
    res.status(500).json({ error: 'Could not load recommendations' })
  }
})

// Get resume skill suggestions for a roadmap
router.get('/resume-skills/:roadmapId', authenticate, requireOwnedRoadmap, async (req, res) => {
  try {
    const skills = await getResumeSkillSuggestions(req.user.id, req.params.roadmapId)
    res.json({ skills })
  } catch (error) {
    console.error('Get resume skill suggestions failed:', error)
    res.status(500).json({ error: 'Could not load suggestions' })
  }
})

// Get mentor recommendations for a roadmap
router.get('/mentors/:roadmapId', authenticate, requireOwnedRoadmap, async (req, res) => {
  try {
    const mentors = await getMentorRecommendations(req.user.id, req.params.roadmapId)
    res.json({ mentors })
  } catch (error) {
    console.error('Get mentor recommendations failed:', error)
    res.status(500).json({ error: 'Could not load recommendations' })
  }
})

// Get learning path suggestions based on user activity
router.get('/learning-path', authenticate, async (req, res) => {
  try {
    const suggestions = await getLearningPathSuggestions(req.user.id)
    res.json({ suggestions })
  } catch (error) {
    console.error('Get learning path suggestions failed:', error)
    res.status(500).json({ error: 'Could not load suggestions' })
  }
})

// Get cross-module insights for dashboard
router.get('/insights', authenticate, async (req, res) => {
  try {
    const insights = await getCrossModuleInsights(req.user.id)
    res.json({ insights })
  } catch (error) {
    console.error('Get cross-module insights failed:', error)
    res.status(500).json({ error: 'Could not load insights' })
  }
})

export default router
