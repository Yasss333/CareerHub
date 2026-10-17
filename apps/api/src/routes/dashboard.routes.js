import express from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'careerhub-super-secret-jwt-key-2024';

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

router.get('/pri/history', authenticate, async (req, res) => {
  try {
    const requestedDays = Number.parseInt(req.query.days, 10);
    const days = Number.isFinite(requestedDays) ? Math.min(Math.max(requestedDays, 1), 365) : 30;
    const from = new Date();
    from.setUTCHours(0, 0, 0, 0);
    from.setUTCDate(from.getUTCDate() - (days - 1));

    const snapshots = await prisma.priSnapshot.findMany({
      where: { userId: req.user.id, snapshotDate: { gte: from } },
      orderBy: { snapshotDate: 'asc' },
    });

    return res.json({ snapshots });
  } catch (error) {
    console.error('Failed to fetch PRI history:', error);
    return res.status(500).json({ error: 'Failed to fetch PRI history' });
  }
});

// Dynamic live PRI computed from actual AI Mock Interviews, AlgoRank, and Resumes
router.get('/pri/live', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Real AI Mock Interview Score (weight: 45%)
    const completedInterviews = await prisma.interviewSession.findMany({
      where: { userId, status: 'completed' },
      orderBy: { endedAt: 'desc' },
      take: 10,
    });

    const interviewScores = completedInterviews
      .map((s) => {
        const score = s.feedback?.overallScore;
        return typeof score === 'number' && Number.isFinite(score) ? score : null;
      })
      .filter((s) => s !== null);

    const hasRealInterview = interviewScores.length > 0;
    const interviewScore = hasRealInterview
      ? Math.round(interviewScores.reduce((a, b) => a + b, 0) / interviewScores.length)
      : 70; // baseline if candidate hasn't taken mock interview yet

    // 2. Real AlgoRank Score (weight: 40%)
    const userStats = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalProblemsSolved: true, rankingScore: true },
    });
    const totalProblems = await prisma.problem.count();
    const algoRankScore = totalProblems > 0
      ? Math.min(100, Math.round(((userStats?.totalProblemsSolved || 0) / Math.max(1, Math.min(totalProblems, 25))) * 100))
      : 0;

    // 3. Real Resume Quality Score (weight: 15%)
    const resumes = await prisma.resume.findMany({
      where: { userId },
      select: { professionSummary: true, skills: true, experience: true, education: true, projects: true, personalInfo: true },
    });
    let resumeScore = 0;
    if (resumes.length > 0) {
      for (const r of resumes) {
        let currentScore = 30;
        if (r.professionSummary && r.professionSummary.length > 20) currentScore += 15;
        if (r.skills && r.skills.length >= 3) currentScore += 15;
        if (Array.isArray(r.experience) && r.experience.length > 0) currentScore += 20;
        if (Array.isArray(r.education) && r.education.length > 0) currentScore += 10;
        if (Array.isArray(r.projects) && r.projects.length > 0) currentScore += 10;
        if (currentScore > resumeScore) resumeScore = Math.min(100, currentScore);
      }
    }

    const score = Number((0.45 * interviewScore + 0.40 * algoRankScore + 0.15 * resumeScore).toFixed(2));

    return res.json({
      score,
      interviewScore,
      algoRankScore,
      resumeScore,
      hasRealInterview,
      interviewCount: completedInterviews.length,
      latestInterviewScore: interviewScores[0] ?? null,
    });
  } catch (error) {
    console.error('Failed to compute live PRI:', error);
    return res.status(500).json({ error: 'Failed to compute live PRI' });
  }
});

router.put('/pri/today', authenticate, async (req, res) => {
  try {
    const { interviewScore, algoRankScore, resumeScore } = req.body ?? {};
    const scores = [interviewScore, algoRankScore, resumeScore];
    if (scores.some((score) => typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 100)) {
      return res.status(400).json({ error: 'All PRI component scores must be numbers from 0 to 100' });
    }

    const snapshotDate = new Date();
    snapshotDate.setUTCHours(0, 0, 0, 0);
    const score = Number((0.45 * interviewScore + 0.4 * algoRankScore + 0.15 * resumeScore).toFixed(2));
    const snapshot = await prisma.priSnapshot.upsert({
      where: { userId_snapshotDate: { userId: req.user.id, snapshotDate } },
      create: { userId: req.user.id, snapshotDate, score, interviewScore, algoRankScore, resumeScore },
      update: { score, interviewScore, algoRankScore, resumeScore },
    });

    return res.json({ snapshot });
  } catch (error) {
    console.error('Failed to save PRI snapshot:', error);
    return res.status(500).json({ error: 'Failed to save PRI snapshot' });
  }
});

export default router;
