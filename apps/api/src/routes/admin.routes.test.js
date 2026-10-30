import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import {createAdminRouter} from './admin.routes.js';

async function withApi(run) {
  const calls = [];
  const users = {admin: {id: 'admin', role: 'ADMIN'}, student: {id: 'student', role: 'USER'}, mentor: {id: 'mentor', role: 'MENTOR', isAlumniMentor: true}};
  const db = {
    user: {findUnique: async ({where}) => users[where.id], findMany: async () => Object.values(users), count: async () => 3, update: async ({where, data}) => Object.assign(users[where.id], data)},
    seniorProfile: {deleteMany: async args => {calls.push(['profile', args]); return {count: 1};}},
    availabilitySlot: {deleteMany: async args => {calls.push(['slots', args]); return {count: 2};}},
    sessionBooking: {findMany: async () => [{id: 'future', juniorId: 'student'}], updateMany: async args => {calls.push(['bookings', args]); return {count: 1};}},
    notification: {createMany: async () => ({count: 1})},
    adminAudit: {create: async args => {calls.push(['audit', args]); return args.data;}, findMany: async () => []},
    roadmap: {findMany: async () => [{id: 'roadmap', progress: 99, milestones: [{id: 'one', isCompleted: true}, {id: 'two', isCompleted: false}]}]},
  };
  db.$transaction = async fn => fn(db);
  const app = express(); app.use(express.json()); app.use('/admin', createAdminRouter({database: db}));
  const server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r));
  const send = async (path, user = 'admin', body, method = 'GET') => {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/admin${path}`, {method, headers: {'Content-Type': 'application/json', ...(user ? {Authorization: 'Bearer ' + jwt.sign({id: user, role: 'ADMIN'}, process.env.JWT_SECRET || 'careerhub-super-secret-jwt-key-2024')} : {})}, body: body ? JSON.stringify(body) : undefined});
    return {status: res.status, data: await res.json()};
  };
  try {await run(send, db, calls, users);} finally {await new Promise(r => server.close(r));}
}
test('all admin surfaces check the current database role, including forged and revoked tokens', () => withApi(async (send, db, calls, users) => {
  for (const path of ['/overview', '/users', '/mentors', '/interviews', '/progress', '/audit']) {
    assert.equal((await send(path, null)).status, 401);
    for (const role of ['student', 'mentor']) assert.equal((await send(path, role)).status, 403);
  }
  users.admin.role = 'USER'; assert.equal((await send('/users')).status, 403);
  assert.equal((await send('/mentors/mentor', 'student', {confirmation: 'mentor', reason: 'Removal test'}, 'DELETE')).status, 403);
  assert.equal(calls.length, 0);
}));
test('admin progress uses completed milestones rather than a stale cached percentage', () => withApi(async send => {
  const res = await send('/progress'); assert.equal(res.status, 200); assert.equal(res.data.items[0].completionPercent, 50); assert.equal(res.data.items[0].completedMilestones, 1);
}));
test('mentor removal is confirmed, transactional, audited and preserves the user/history', () => withApi(async (send, db, calls, users) => {
  assert.equal((await send('/mentors/mentor', 'admin', {confirmation: 'wrong', reason: 'Removal test'}, 'DELETE')).status, 400);
  assert.equal((await send('/mentors/admin', 'admin', {confirmation: 'admin', reason: 'Removal test'}, 'DELETE')).status, 409);
  const result = await send('/mentors/mentor', 'admin', {confirmation: 'mentor', reason: 'QA mentor removal'}, 'DELETE');
  assert.equal(result.status, 200); assert.equal(users.mentor.role, 'USER'); assert.equal(users.mentor.isAlumniMentor, false);
  const slots = calls.find(c => c[0] === 'slots')[1]; assert.equal(slots.where.isBooked, false); assert.deepEqual(slots.where.bookings, {none: {}});
  const booking = calls.find(c => c[0] === 'bookings')[1]; assert.ok(booking.where.scheduledTime.gt instanceof Date); assert.deepEqual(booking.where.status.in, ['pending', 'accepted']);
  assert.equal(calls.filter(c => c[0] === 'audit').length, 1);
  assert.equal((await send('/mentors/mentor', 'admin', {confirmation: 'mentor', reason: 'Repeated removal'}, 'DELETE')).status, 409);
}));
test('admin list pagination rejects malformed boundaries', () => withApi(async send => {
  for (const query of ['?page=-1', '?page=NaN', '?q=' + 'x'.repeat(121)]) assert.equal((await send('/users' + query)).status, 400);
}));
