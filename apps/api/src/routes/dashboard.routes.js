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
