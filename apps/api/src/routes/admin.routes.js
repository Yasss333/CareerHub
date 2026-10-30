import express from 'express';
import jwt from 'jsonwebtoken';
import {PrismaClient} from '@prisma/client';

const identity = {id: true, name: true, email: true};
const userFields = {...identity, role: true, mentorApprovalStatus: true, isAlumniMentor: true, createdAt: true};
const badInput = message => Object.assign(new Error(message), {status: 400});

export function createAdminRouter({database = new PrismaClient()} = {}) {
  const router = express.Router(); const db = database;
  router.use(async (req, res, next) => {
    try {
      const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
      if (!token) return res.status(401).json({error: 'Sign in to continue'});
      let decoded;
      try {decoded = jwt.verify(token, process.env.JWT_SECRET || 'careerhub-super-secret-jwt-key-2024');}
      catch {return res.status(401).json({error: 'Your session expired. Sign in again.'});}
      if (typeof decoded?.id !== 'string' || !decoded.id.trim()) return res.status(401).json({error: 'Invalid account'});
      const user = await db.user.findUnique({where: {id: decoded.id}, select: {id: true, role: true}});
      if (!user) return res.status(401).json({error: 'Account not found'});
      if (user.role !== 'ADMIN') return res.status(403).json({error: 'Administrator access required'});
      req.adminId = user.id; next();
    } catch (error) {next(error);}
  });
  const pageOptions = req => {
    const page = Number(req.query.page || 1);
    if (!Number.isInteger(page) || page < 1 || page > 10000) throw badInput('Invalid page');
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (q.length > 120) throw badInput('Search must be at most 120 characters');
    return {page, q, skip: (page - 1) * 30};
  };
  const searchUser = q => q ? {OR: [{name: {contains: q, mode: 'insensitive'}}, {email: {contains: q, mode: 'insensitive'}}]} : {};
  const listResult = (rows, page) => ({items: rows.slice(0, 30), page, hasMore: rows.length > 30});
  router.get('/overview', async (req, res, next) => {
    try {
      const [users, mentors, pendingMentors, interviews, completedInterviews, roadmaps, openFeedback, bookings] = await Promise.all([
        db.user.count(), db.user.count({where: {role: 'MENTOR', isAlumniMentor: true}}), db.user.count({where: {mentorApprovalStatus: 'PENDING'}}),
        db.interviewSession.count(), db.interviewSession.count({where: {status: 'completed'}}), db.roadmap.count(),
        db.feedbackReport.count({where: {status: {in: ['OPEN', 'IN_PROGRESS']}}}), db.sessionBooking.count({where: {status: {in: ['pending', 'accepted', 'started']}}}),
      ]);
      res.json({users, mentors, pendingMentors, interviews, completedInterviews, roadmaps, openFeedback, bookings});
    } catch (error) {next(error);}
  });
  router.get('/users', async (req, res, next) => {
    try {
      const {page, q, skip} = pageOptions(req);
      const rows = await db.user.findMany({where: searchUser(q), select: {...userFields, _count: {select: {interviewSessions: true, resumes: true, roadmaps: true}}}, take: 31, skip, orderBy: [{createdAt: 'desc'}, {id: 'asc'}]});
      res.json(listResult(rows, page));
    } catch (error) {next(error);}
  });
  router.get('/mentors', async (req, res, next) => {
    try {
      const {page, q, skip} = pageOptions(req);
      const rows = await db.user.findMany({where: {role: 'MENTOR', ...searchUser(q)}, select: {...userFields, seniorProfile: {select: {title: true, company: true, rating: true, sessionCount: true}}, _count: {select: {sessionBookingsAsSenior: true}}}, take: 31, skip, orderBy: [{createdAt: 'desc'}, {id: 'asc'}]});
      res.json(listResult(rows, page));
    } catch (error) {next(error);}
  });
  router.delete('/mentors/:id', async (req, res, next) => {
    try {
      const {confirmation, reason} = req.body || {};
      if (confirmation !== req.params.id || typeof reason !== 'string' || reason.trim().length < 5 || reason.length > 500) throw badInput('Confirm this mentor and enter a reason of 5–500 characters');
      const result = await db.$transaction(async tx => {
        const mentor = await tx.user.findUnique({where: {id: req.params.id}, select: userFields});
        if (!mentor) throw Object.assign(new Error('Mentor not found'), {status: 404});
        if (mentor.role !== 'MENTOR') throw Object.assign(new Error('This account is not an active mentor'), {status: 409});
        const where = {seniorId: mentor.id, status: {in: ['pending', 'accepted']}, scheduledTime: {gt: new Date()}};
        const upcoming = await tx.sessionBooking.findMany({where, select: {id: true, juniorId: true}});
        await tx.user.update({where: {id: mentor.id}, data: {role: 'USER', isAlumniMentor: false, mentorApprovalStatus: 'REJECTED'}});
        await tx.seniorProfile.deleteMany({where: {userId: mentor.id}});
        await tx.availabilitySlot.deleteMany({where: {seniorId: mentor.id, isBooked: false, bookings: {none: {}}}});
        const cancelled = await tx.sessionBooking.updateMany({where, data: {status: 'cancelled'}});
        if (upcoming.length) await tx.notification.createMany({data: upcoming.map(booking => ({userId: booking.juniorId, type: 'session_cancelled', title: 'Mentor session cancelled', message: 'This mentor is no longer available. Please choose another mentor.', data: {sessionId: booking.id}}))});
        await tx.adminAudit.create({data: {actorId: req.adminId, action: 'mentor.removed', targetId: mentor.id, details: {reason: reason.trim(), cancelledBookings: cancelled.count}}});
        return {removed: true, cancelledBookings: cancelled.count};
      }, {isolationLevel: 'Serializable'});
      res.json(result);
    } catch (error) {next(error);}
  });
  router.get('/progress', async (req, res, next) => {
    try {
      const {page, q, skip} = pageOptions(req);
      const rows = await db.roadmap.findMany({where: q ? {OR: [{title: {contains: q, mode: 'insensitive'}}, {user: searchUser(q)}]} : {}, select: {id: true, title: true, roleType: true, status: true, updatedAt: true, user: {select: identity}, milestones: {select: {id: true, title: true, order: true, isCompleted: true, completedAt: true, dueDate: true}, orderBy: {order: 'asc'}}}, take: 31, skip, orderBy: [{updatedAt: 'desc'}, {id: 'asc'}]});
      res.json(listResult(rows.map(row => {const completed = row.milestones.filter(m => m.isCompleted).length; return {...row, completedMilestones: completed, completionPercent: row.milestones.length ? Math.round(completed / row.milestones.length * 100) : 0};}), page));
    } catch (error) {next(error);}
  });
  router.get('/interviews', async (req, res, next) => {
    try {
      const {page, q, skip} = pageOptions(req);
      const rows = await db.interviewSession.findMany({where: q ? {user: searchUser(q)} : {}, select: {id: true, role: true, type: true, status: true, createdAt: true, durationSeconds: true, monitoringMode: true, feedback: true, user: {select: identity}, _count: {select: {questions: true, proctoringEvents: true, emotionResults: true}}}, take: 31, skip, orderBy: [{createdAt: 'desc'}, {id: 'asc'}]});
      res.json(listResult(rows.map(({feedback, ...row}) => ({...row, score: typeof feedback?.overallScore === 'number' ? feedback.overallScore : null})), page));
    } catch (error) {next(error);}
  });
  router.get('/audit', async (req, res, next) => {
    try {
      const {page, skip} = pageOptions(req);
      res.json(listResult(await db.adminAudit.findMany({include: {actor: {select: identity}}, take: 31, skip, orderBy: [{createdAt: 'desc'}, {id: 'asc'}]}), page));
    } catch (error) {next(error);}
  });
  router.use((error, req, res, next) => {
    if (error.status) return res.status(error.status).json({error: error.message});
    if (error.code === 'P2034') return res.status(409).json({error: 'This record changed. Refresh and retry.'});
    console.error('Admin operation failed:', error.code || error.name);
    res.status(503).json({error: 'Admin data could not be loaded or updated. Please retry.'});
  });
  return router;
}
export default createAdminRouter();
