// Real API/PostgreSQL smoke using only accounts and records created by this run.
import '../apps/api/src/load-env.js';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {PrismaClient} from '@prisma/client';
const db = new PrismaClient(), accounts = [], checks = [];
const prefix = 'interview-admin-qa-' + Date.now(); const password = crypto.randomBytes(20).toString('base64url');
const origin = 'http://127.0.0.1:5000';
const send = async (path, account, body, method = body ? 'POST' : 'GET') => {
  const response = await fetch(origin + '/api' + path, {method, headers: {'Content-Type': 'application/json', ...(account ? {Authorization: 'Bearer ' + account.token} : {})}, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(180000)});
  return {status: response.status, data: await response.json()};
};
const ok = result => {assert.ok(result.status >= 200 && result.status < 300, `${result.status}: ${JSON.stringify(result.data)}`); return result.data};
const check = name => {checks.push({name, status: 'PASS'}); console.log('PASS:', name)};
async function register(label, role = 'USER') {
  const result = ok(await send('/auth/register', null, {email: `${prefix}-${label}@example.com`, name: label, password, role, ...(role === 'USER' ? {specialization: 'CS_SOFTWARE'} : {})}));
  const account = {...result.user, token: result.token}; accounts.push(account); return account;
}
try {
  const student = await register('candidate'), other = await register('other'), admin = await register('operator'), mentor = await register('mentor', 'MENTOR');
  await db.user.update({where: {id: admin.id}, data: {role: 'ADMIN'}});
  admin.token = ok(await send('/auth/login', null, {email: admin.email, password})).token;
  assert.equal((await send('/admin/overview', student)).status, 403);
  check('Current database ADMIN role required; normal login works for admin');
  const overview = ok(await send('/admin/overview', admin)); assert.equal(typeof overview.users, 'number');
  const users = ok(await send('/admin/users?q=' + encodeURIComponent(prefix), admin)).items; assert.equal(users.length, 4); assert.ok(users.every(row => !('passwordHash' in row)));
  ok(await send(`/connect/admin/mentor-applications/${mentor.id}`, admin, {decision: 'approve'}, 'PATCH'));
  await db.seniorProfile.update({where: {userId: mentor.id}, data: {userId: mentor.id, title: 'QA mentor', company: 'QA only', domain: 'Software', role: 'Engineer', bio: 'Synthetic test fixture', location: 'Remote', expertise: ['Databases'], achievements: []}});
  const start = new Date(Date.now() + 86400000), past = new Date(Date.now() - 86400000);
  const slots = await db.availabilitySlot.create({data: {seniorId: mentor.id, date: start, startTime: '10:00', endTime: '11:00'}});
  const completed = await db.sessionBooking.create({data: {juniorId: student.id, seniorId: mentor.id, scheduledTime: past, topic: 'QA completed', status: 'completed'}});
  const future = await db.sessionBooking.create({data: {juniorId: student.id, seniorId: mentor.id, scheduledTime: start, topic: 'QA future', status: 'accepted'}});
  const roadmap = await db.roadmap.create({data: {userId: student.id, title: prefix + ' roadmap', description: 'Synthetic roadmap', roleType: 'Backend', topics: [], resources: [], progress: 99, milestones: {create: [{title: 'SQL', description: 'SQL foundation', order: 0, topics: [], resources: [], isCompleted: true}, {title: 'Systems', description: 'Systems foundation', order: 1, topics: [], resources: []}]}}});
  const progress = ok(await send('/admin/progress?q=' + encodeURIComponent(prefix), admin));
  assert.equal(progress.items.find(row => row.id === roadmap.id).completionPercent, 50);
  check('Real admin milestone progress ignores stale cached percentage');
  assert.ok(ok(await send('/admin/mentors?q=' + encodeURIComponent(prefix), admin)).items.some(row => row.id === mentor.id));
  assert.equal((await send('/admin/mentors/' + mentor.id, student, {confirmation: mentor.id, reason: 'QA removal'}, 'DELETE')).status, 403);
  ok(await send('/admin/mentors/' + mentor.id, admin, {confirmation: mentor.id, reason: 'Synthetic smoke fixture removal'}, 'DELETE'));
  assert.equal((await db.user.findUnique({where: {id: mentor.id}})).role, 'USER');
  assert.equal(await db.seniorProfile.findUnique({where: {userId: mentor.id}}), null);
  assert.equal(await db.availabilitySlot.findUnique({where: {id: slots.id}}), null);
  assert.equal((await db.sessionBooking.findUnique({where: {id: completed.id}})).status, 'completed');
  assert.equal((await db.sessionBooking.findUnique({where: {id: future.id}})).status, 'cancelled');
  assert.equal(await db.adminAudit.count({where: {actorId: admin.id, targetId: mentor.id}}), 1);
  check('Mentor removal preserves completed history, cancels future booking, removes listing and audits');
  const session = ok(await send('/interview/sessions', student, {topics: ['Databases'], monitoringMode: 'proctored', introductionRequired: true, consent: {camera: true, microphone: true, screen: true}})).session;
  const introPath = `/interview/sessions/${session.id}/introduction`, eventPath = `/interview/sessions/${session.id}/proctor-events`;
  assert.equal((await send(introPath, other, {text: 'Another user'}, 'PUT')).status, 404);
  assert.equal((await send(introPath, student, {text: 'Synthetic introduction'}, 'PUT')).status, 409);
  ok(await send(eventPath, student, {eventType: 'screen_started'}));
  ok(await send(introPath, student, {text: 'I am a synthetic QA candidate practicing database interviews.'}, 'PUT'));
  const question = await db.interviewQuestion.create({data: {sessionId: session.id, questionIndex: 0, questionText: 'Explain the benefits and costs of a database index.', expectedAnswerPoints: ['Faster lookup', 'Write overhead', 'Storage overhead'], evaluationCriteria: ['Accuracy']}});
  ok(await send(eventPath, student, {eventType: 'screen_stopped'}));
  assert.equal((await send(`/interview/questions/${question.id}/answer`, student, {answerText: 'A synthetic answer'}, 'PUT')).status, 409);
  check('Introduction ownership and screen-stop lease gate enforced by real API');
  // Tests may deliberately create a screen transition immediately after the previous event.
  await new Promise(r => setTimeout(r, 2100)); ok(await send(eventPath, student, {eventType: 'screen_started'}));
  if (process.env.RUN_PROVIDER_SMOKE === 'true') {
    console.log('Running real text inference and evaluation with a synthetic answer only…');
    ok(await send(`/interview/questions/${question.id}/answer`, student, {answerText: 'A database index stores an ordered structure such as a B-tree so the database can find matching rows without scanning the whole table. It speeds up selective reads but consumes storage and adds maintenance work on inserts, updates and deletes. I would choose columns using actual query plans and workload measurements.'}, 'PUT'));
    const evaluated = ok(await send(`/interview/sessions/${session.id}/evaluate`, student, {})).session;
    assert.equal(evaluated.status, 'completed'); assert.equal(typeof evaluated.feedback.overallScore, 'number'); assert.equal(evaluated.questions.length, 1); assert.ok(evaluated.candidateIntroduction);
    checks.push({name: 'Synthetic answer saved, real provider evaluation completed, intro excluded from scored questions', status: 'PASS', score: evaluated.feedback.overallScore, successfulModelRecords: evaluated.emotionResults.filter(r => r.result.source === 'ml' && r.result.success).length});
    console.log('PASS: real provider evaluation completed');
  }
  const activity = ok(await send('/admin/interviews?q=' + encodeURIComponent(prefix), admin)).items; assert.ok(activity.some(row => row.id === session.id)); assert.ok(activity.every(row => !('candidateIntroduction' in row) && !('questions' in row)));
  await db.user.update({where: {id: admin.id}, data: {role: 'USER'}});
  assert.equal((await send('/admin/overview', admin)).status, 403); assert.equal((await send('/algorank/problems', admin, {})).status, 403); check('Existing JWT loses admin and problem-library write access immediately after database demotion');
  fs.mkdirSync('../outputs', {recursive: true}); fs.writeFileSync(process.env.RUN_PROVIDER_SMOKE === 'true' ? '../outputs/interview-admin-live-qa.json' : '../outputs/interview-admin-access-qa.json', JSON.stringify({checks, syntheticDataOnly: true}, null, 2));
} finally {
  const ids = accounts.map(a => a.id);
  if (ids.length) {
    const owned = await db.user.findMany({where: {id: {in: ids}}, select: {id: true, email: true}}); assert.ok(owned.every(u => u.email.startsWith(prefix + '-')));
    await db.adminAudit.deleteMany({where: {actorId: {in: ids}}});
    await db.sessionBooking.deleteMany({where: {juniorId: {in: ids}, seniorId: {in: ids}}});
    await db.user.deleteMany({where: {id: {in: ids}, email: {startsWith: prefix + '-'}}});
    assert.equal(await db.user.count({where: {id: {in: ids}}}), 0); console.log('Scoped QA accounts and fixtures removed.');
  }
  await db.$disconnect();
}
