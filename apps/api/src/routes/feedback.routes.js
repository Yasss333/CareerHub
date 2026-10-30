import express from 'express';
import jwt from 'jsonwebtoken';
import {isDeepStrictEqual} from 'node:util';
import {PrismaClient} from '@prisma/client';
import {FeedbackInputError, parseFeedback, feedbackStatuses} from '../services/feedback-validation.js';

export function createFeedbackRouter({database = new PrismaClient()} = {}) {
  const router = express.Router();
  const db = database;
  const include = {user: {select: {name: true, email: true}}};
  router.use(async (req, res, next) => {
    try {
      const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
      if (!token) return res.status(401).json({error: 'Sign in to use feedback'});
      let decoded;
      try { decoded = jwt.verify(token, process.env.JWT_SECRET || 'careerhub-super-secret-jwt-key-2024'); }
      catch { return res.status(401).json({error: 'Your session expired. Sign in again.'}); }
      if (typeof decoded?.id !== 'string' || !decoded.id.trim()) return res.status(401).json({error: 'Invalid account'});
      const user = await db.user.findUnique({where: {id: decoded.id}, select: {id: true, role: true}});
      if (!user) return res.status(401).json({error: 'Account not found'});
      req.feedbackUser = user;
      next();
    } catch (error) { next(error); }
  });
  const admin = (req, res, next) => req.feedbackUser.role === 'ADMIN' ? next() : res.status(403).json({error: 'Administrator access required'});
  const duplicate = (res, existing, payload) => isDeepStrictEqual(existing.payload, payload)
    ? res.json({report: existing}) : res.status(409).json({error: 'This report was already submitted. Start a new report for changes.'});

  router.post('/', async (req, res, next) => {
    let parsed;
    try {
      parsed = parseFeedback(req.body);
      const userId = req.feedbackUser.id;
      const key = {userId_requestId: {userId, requestId: parsed.requestId}};
      const existing = await db.feedbackReport.findUnique({where: key, include});
      if (existing) return duplicate(res, existing, parsed.payload);
      const recent = await db.feedbackReport.count({where: {userId, createdAt: {gte: new Date(Date.now() - 10 * 60 * 1000)}}});
      if (recent >= 5) return res.status(429).set('Retry-After', '600').json({error: 'You have sent five reports recently. Please wait ten minutes before sending another.'});
      const report = await db.feedbackReport.create({data: {userId, ...parsed, status: 'OPEN'}, include});
      return res.status(201).json({report});
    } catch (error) {
      if (error.code === 'P2002' && parsed) {
        try {
          const existing = await db.feedbackReport.findUnique({where: {userId_requestId: {userId: req.feedbackUser.id, requestId: parsed.requestId}}, include});
          if (existing) return duplicate(res, existing, parsed.payload);
        } catch (lookupError) { return next(lookupError); }
      }
      next(error);
    }
  });
  router.get('/', async (req, res, next) => {
    try {
      if (req.query.scope && !['mine', 'all'].includes(req.query.scope)) throw new FeedbackInputError('Invalid feedback scope');
      if (req.query.scope === 'all' && req.feedbackUser.role !== 'ADMIN') return res.status(403).json({error: 'Administrator access required'});
      if (req.query.status && !feedbackStatuses.includes(req.query.status)) throw new FeedbackInputError('Invalid feedback status');
      const where = {...(req.query.scope === 'all' ? {} : {userId: req.feedbackUser.id}), ...(req.query.status ? {status: req.query.status} : {})};
      const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
      if (cursor) {
        const report = await db.feedbackReport.findUnique({where: {id: cursor}});
        if (!report || (where.userId && report.userId !== where.userId)) throw new FeedbackInputError('Invalid feedback cursor');
      }
      const rows = await db.feedbackReport.findMany({where, include, orderBy: [{createdAt: 'desc'}, {id: 'desc'}], take: 31, ...(cursor ? {cursor: {id: cursor}, skip: 1} : {})});
      return res.json({reports: rows.slice(0, 30), nextCursor: rows.length > 30 ? rows[29].id : null});
    } catch (error) { next(error); }
  });
  router.patch('/:id', admin, async (req, res, next) => {
    try {
      const {status, resolutionNote = ''} = req.body || {};
      if (!feedbackStatuses.includes(status) || typeof resolutionNote !== 'string' || resolutionNote.length > 1500) throw new FeedbackInputError('Choose a valid status and an update of at most 1500 characters');
      const report = await db.feedbackReport.update({where: {id: req.params.id}, data: {status, resolutionNote: resolutionNote.trim()}, include});
      return res.json({report});
    } catch (error) {
      if (error.code === 'P2025') return res.status(404).json({error: 'Report not found'});
      next(error);
    }
  });
  router.use((error, req, res, next) => {
    if (error instanceof FeedbackInputError) return res.status(400).json({error: error.message});
    console.error('Feedback operation failed:', error.code || error.name);
    return res.status(503).json({error: 'Feedback could not be saved or loaded. Please retry; your draft is still here.'});
  });
  return router;
}
export default createFeedbackRouter();
