import '../apps/api/src/load-env.js';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import {PrismaClient} from '@prisma/client';
import {createAdminRouter} from '../apps/api/src/routes/admin.routes.js';

// Exercise actual foreign keys using only accounts created by this run.
assert.ok(['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname), 'Local QA database required');
const db = new PrismaClient(), ids = [randomUUID(), randomUUID(), randomUUID()];
const [adminId, targetId, peerId] = ids;
const app = express(); app.use(express.json()); app.use('/admin', createAdminRouter({database: db}));
let server;
try {
  for (const [index, id] of ids.entries()) await db.user.create({data: {id, email: `delete-qa-${id}@example.com`, passwordHash: 'unusable-qa-hash', role: index === 0 ? 'ADMIN' : index === 1 ? 'MENTOR' : 'USER'}});
  const slot = await db.availabilitySlot.create({data: {seniorId: peerId, date: new Date(), startTime: '10:00', endTime: '11:00', isBooked: true}});
  const booking = await db.sessionBooking.create({data: {juniorId: targetId, seniorId: peerId, availabilitySlotId: slot.id, scheduledTime: new Date(Date.now() + 86400000), topic: 'QA', status: 'accepted'}});
  await db.sessionFeedback.create({data: {bookingId: booking.id, rating: 4, comment: 'QA', tags: []}});
  await db.sessionMessage.create({data: {sessionId: booking.id, senderId: targetId, message: 'QA'}});
  await db.credibilityScore.create({data: {userId: targetId, factors: {}}});
  await db.resume.create({data: {userId: targetId, skills: [], personalInfo: {}, experience: [], projects: [], education: []}});
  const interview = await db.interviewSession.create({data: {userId: targetId, topics: []}});
  await db.interviewQuestion.create({data: {sessionId: interview.id, questionText: 'QA', questionIndex: 0}});
  const roadmap = await db.roadmap.create({data: {userId: targetId, title: 'QA', description: 'QA', roleType: 'QA', topics: {}, resources: {}}});
  await db.roadmapMilestone.create({data: {roadmapId: roadmap.id, title: 'QA', description: 'QA', order: 0, topics: {}, resources: {}}});
  const problem = await db.problem.create({data: {userID: targetId, title: 'QA', description: 'QA', difficulty: 'EASY', tags: [], examples: {}, constraints: 'QA', testcases: {}}});
  const submission = await db.submission.create({data: {userID: peerId, problemID: problem.id, sourceCode: 'QA', language: 'javascript', status: 'accepted'}});
  server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  const remove = () => fetch(`http://127.0.0.1:${server.address().port}/admin/users/${targetId}`, {method: 'DELETE', headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + jwt.sign({id: adminId}, process.env.JWT_SECRET)}, body: JSON.stringify({confirmation: targetId, reason: 'Disposable QA account cleanup'})});
  // A failed transaction must leave the account and its related records intact.
  const transaction = db.$transaction.bind(db);
  db.$transaction = (run, options) => transaction(tx => run(new Proxy(tx, {get(target, key) {return key === 'adminAudit' ? {create: async () => {throw new Error('Injected audit failure');}} : target[key];}})), options);
  assert.equal((await remove()).status, 503);
  assert.ok(await db.user.findUnique({where: {id: targetId}}));
  assert.ok(await db.sessionBooking.findUnique({where: {id: booking.id}}));
  db.$transaction = transaction;
  assert.equal((await remove()).status, 200);
  assert.equal(await db.user.findUnique({where: {id: targetId}}), null);
  for (const model of ['resume', 'interviewSession', 'roadmap', 'credibilityScore']) assert.equal(await db[model].count({where: {userId: targetId}}), 0);
  assert.equal(await db.sessionBooking.findUnique({where: {id: booking.id}}), null);
  assert.equal(await db.sessionFeedback.count({where: {bookingId: booking.id}}), 0);
  assert.equal(await db.sessionMessage.count({where: {sessionId: booking.id}}), 0);
  assert.equal((await db.availabilitySlot.findUnique({where: {id: slot.id}})).isBooked, false);
  assert.equal((await db.problem.findUnique({where: {id: problem.id}})).userID, adminId);
  assert.ok(await db.submission.findUnique({where: {id: submission.id}}));
  assert.equal(await db.adminAudit.count({where: {targetId, action: 'user.deleted'}}), 1);
  console.log('PASS: actual PostgreSQL cascade cleanup, transaction rollback, slot release, shared problem/submission preservation and audit');
} finally {
  if (server) await new Promise(resolve => server.close(resolve));
  await db.sessionFeedback.deleteMany({where: {booking: {OR: [{juniorId: {in: ids}}, {seniorId: {in: ids}}]}}});
  await db.sessionBooking.deleteMany({where: {OR: [{juniorId: {in: ids}}, {seniorId: {in: ids}}]}});
  await db.credibilityScore.deleteMany({where: {userId: {in: ids}}});
  await db.submission.deleteMany({where: {userID: {in: ids}}});
  await db.adminAudit.deleteMany({where: {actorId: {in: ids}}});
  await db.user.deleteMany({where: {id: {in: ids}}});
  await db.$disconnect();
}
