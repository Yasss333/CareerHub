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

const calculatePri = async (userId) => {
  const completedInterviews = await prisma.interviewSession.findMany({
    where: { userId, status: 'completed' },
    orderBy: { endedAt: 'desc' },
    take: 10,
  });
  const interviewScores = completedInterviews
    .map((session) => {
      const score = Number(session.feedback?.overallScore ?? session.feedback?.overall_score ?? session.feedback?.score ?? 0);
      return Number.isFinite(score) && score > 0 ? score : null;
    })
    .filter((score) => score !== null);
  const interviewScore = interviewScores.length
    ? Math.round(interviewScores.reduce((sum, value) => sum + value, 0) / interviewScores.length)
    : 0;

  const [userStats, totalProblems, resumes] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { totalProblemsSolved: true },
    }),
    prisma.problem.count(),
    prisma.resume.findMany({
      where: { userId },
      select: { professionSummary: true, skills: true, experience: true, education: true, projects: true, personalInfo: true },
    }),
  ]);

  const algoRankScore = totalProblems > 0
    ? Math.min(100, Math.round(((userStats?.totalProblemsSolved || 0) / Math.max(1, Math.min(totalProblems, 25))) * 100))
    : 0;
  let resumeScore = 0;
  for (const resume of resumes) {
    let currentScore = 0;
    if (resume.professionSummary && resume.professionSummary.length > 20) currentScore += 15;
    if (resume.skills && resume.skills.length >= 3) currentScore += 15;
    if (Array.isArray(resume.experience) && resume.experience.length > 0) currentScore += 20;
    if (Array.isArray(resume.education) && resume.education.length > 0) currentScore += 10;
    if (Array.isArray(resume.projects) && resume.projects.length > 0) currentScore += 10;
    if (resume.personalInfo && Object.keys(resume.personalInfo).length > 0) currentScore += 30;
    resumeScore = Math.max(resumeScore, Math.min(100, currentScore));
  }

  return {
    score: Number((0.45 * interviewScore + 0.40 * algoRankScore + 0.15 * resumeScore).toFixed(2)),
    interviewScore,
    algoRankScore,
    resumeScore,
    hasRealInterview: interviewScores.length > 0,
    interviewCount: interviewScores.length,
    latestInterviewScore: interviewScores[0] ?? null,
  };
};

router.get('/pri/live', authenticate, async (req, res) => {
  try {
    return res.json(await calculatePri(req.user.id));
  } catch (error) {
    console.error('Failed to compute live PRI:', error);
    return res.status(500).json({ error: 'Failed to compute live PRI' });
  }
});

router.put('/pri/today', authenticate, async (req, res) => {
  try {
    const suppliedComponents = ['interviewScore', 'algoRankScore', 'resumeScore']
      .some((key) => Object.prototype.hasOwnProperty.call(req.body ?? {}, key));
    if (suppliedComponents) {
      return res.status(400).json({ error: 'PRI component scores are derived server-side and cannot be supplied by clients.' });
    }

    const pri = await calculatePri(req.user.id);
    const snapshotDate = new Date();
    snapshotDate.setUTCHours(0, 0, 0, 0);
    const snapshot = await prisma.priSnapshot.upsert({
      where: { userId_snapshotDate: { userId: req.user.id, snapshotDate } },
      create: {
        userId: req.user.id,
        snapshotDate,
        score: pri.score,
        interviewScore: pri.interviewScore,
        algoRankScore: pri.algoRankScore,
        resumeScore: pri.resumeScore,
      },
      update: { score: pri.score, interviewScore: pri.interviewScore, algoRankScore: pri.algoRankScore, resumeScore: pri.resumeScore },
    });

    return res.json({ snapshot });
  } catch (error) {
    console.error('Failed to save PRI snapshot:', error);
    return res.status(500).json({ error: 'Failed to save PRI snapshot' });
  }
});

export default router;
