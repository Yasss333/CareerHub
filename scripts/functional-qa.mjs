import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: 'apps/api/.env' });
const db = new PrismaClient();
const origin = process.env.QA_API_ORIGIN || 'http://127.0.0.1:5000';
const runId = `qa-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
const password = crypto.randomBytes(24).toString('base64url');
const accounts = [], results = [], fixtures = {};
const output = path.resolve('../work/functional-qa-results.json');
const createdBookings = new Set();
const futureDate = (days = 3) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

async function api(route, { method = 'GET', body, account, token, raw, binary = false } = {}) {
  if (/\/api\/algorank\/(execute|run|submit)(\/|$)/.test(route)) throw new Error('Code execution is explicitly excluded');
  const response = await fetch(origin + route, {
    method, headers: { ...(body !== undefined || raw !== undefined ? { 'Content-Type': 'application/json' } : {}), ...((token || account?.token) ? { Authorization: `Bearer ${token || account.token}` } : {}) },
    body: raw !== undefined ? raw : body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(150000),
  });
  if (binary) return { status: response.status, bytes: Buffer.from(await response.arrayBuffer()), type: response.headers.get('content-type') };
  const data = await response.json().catch(() => null);
  if (route === '/api/auth/register' && response.status === 201 && data?.user?.id) accounts.push({ ...data.user, token: data.token });
  if (route === '/api/connect/sessions' && response.status === 201 && data?.id) createdBookings.add(data.id);
  return { status: response.status, data };
}

function status(result, expected) {
  assert.ok([expected].flat().includes(result.status), `Expected HTTP ${[expected].flat().join('/')}, got ${result.status}: ${String(result.data?.error || result.data?.message || '').slice(0, 160)}`);
  return result.data;
}
function need(...keys) {
  for (const key of keys) if (!fixtures[key]) throw Object.assign(new Error(`Fixture ${key} unavailable`), { blocked: true });
}
async function check(module, name, fn) {
  const start = Date.now();
  try { await fn(); results.push({ module, name, status: 'PASSED', durationMs: Date.now() - start }); }
  catch (error) { results.push({ module, name, status: error.blocked ? 'BLOCKED' : 'FAILED', message: error.message, durationMs: Date.now() - start }); }
  const result = results.at(-1);
  console.log(`${result.status} | ${module} | ${name}${result.message ? ' | ' + result.message : ''}`);
  fs.writeFileSync(output, JSON.stringify({ runId, results }, null, 2));
}
async function register(label, extra = {}) {
  const email = `${runId}-${label}@example.com`;
  const response = await api('/api/auth/register', { method: 'POST', body: { email, password, name: `Functional QA ${label}`, specialization: 'CS_SOFTWARE', ...extra } });
  const data = status(response, 201);
  return accounts.find((account) => account.id === data.user.id);
}

async function run() {
  for (const label of ['student', 'outsider', 'mentor']) await check('Setup', `Create temporary ${label}`, async () => { fixtures[label] = await register(label, label === 'mentor' ? { role: 'MENTOR', specialization: undefined } : {}); });
  need('student', 'outsider');
  const a = fixtures.student, b = fixtures.outsider;
  await check('Resume uploads','ImageKit signing uses the installed SDK and returns a bounded signature',async()=>{
    const result=await api('/api/resume/imagekit-auth',{account:a});status(result,200);assert.equal(typeof result.data.signature,'string');assert.ok(result.data.expire>Date.now()/1000);assert.equal(result.data.privateKey,undefined);
  });

  for (const [name, body] of [
    ['rejects malformed email', { email: `${runId}-invalid`, password }],
    ['rejects empty password', { email: `${runId}-empty@example.com`, password: '' }],
    ['rejects a short password', { email: `${runId}-short@example.com`, password: '123' }],
    ['rejects non-string password', { email: `${runId}-object@example.com`, password: { password } }],
    ['rejects missing email', { password }],
  ]) await check('Accounts', name, async () => status(await api('/api/auth/register', { method: 'POST', body: { specialization: 'CS_SOFTWARE', ...body } }), 400));
  await check('Accounts', 'duplicate registration is rejected', async () => status(await api('/api/auth/register', { method: 'POST', body: { email: a.email, password, specialization: 'CS_SOFTWARE' } }), [400, 409]));
  await check('Accounts', 'wrong password is rejected', async () => status(await api('/api/auth/login', { method: 'POST', body: { email: a.email, password: 'wrong-password' } }), 401));
  await check('Accounts', 'malformed login body is a client error', async () => status(await api('/api/auth/login', { method: 'POST', body: { email: { value: a.email }, password } }), 400));
  await check('Accounts', 'registration cannot self-assign administrator', async () => status(await api('/api/auth/register', { method: 'POST', body: { email: `${runId}-admin-request@example.com`, password, specialization: 'CS_SOFTWARE', role: 'ADMIN' } }), 400));
  await check('Accounts', 'a user cannot patch their own role', async () => { const data = status(await api('/api/auth/me', { method: 'PATCH', account: a, body: { name: a.name, email: a.email, role: 'ADMIN', isAlumniMentor: true } }), 200); assert.equal(data.user.role, 'USER'); assert.equal(data.user.isAlumniMentor, false); });
  await check('Accounts', 'email change requires the current password', async () => status(await api('/api/auth/me', { method: 'PATCH', account: a, body: { name: a.name, email: `${runId}-changed@example.com` } }), 400));
  await check('Accounts', 'ordinary user cannot review mentor applications', async () => status(await api('/api/connect/admin/mentor-applications', { account: a }), 403));
  for (const route of ['/api/resume', '/api/roadmaps', '/api/interview/sessions', '/api/connect/sessions', '/api/dashboard/pri/live', '/api/achievements', '/api/recommendations/insights']) {
    await check('Authentication', `missing token rejected: ${route}`, async () => status(await api(route), 401));
    await check('Authentication', `forged token rejected: ${route}`, async () => status(await api(route, { token: 'not-a-valid-token' }), 401));
  }
  await check('HTTP input', 'malformed JSON is rejected as 400', async () => status(await api('/api/interview/sessions', { method: 'POST', account: a, raw: '{broken' }), 400));
  await check('HTTP input', 'oversized JSON is rejected as 413', async () => status(await api('/api/interview/sessions', { method: 'POST', account: a, body: { topics: ['QA'], junk: 'x'.repeat(2 * 1024 * 1024 + 1000) } }), 413));

  await check('Dashboard', 'new account PRI is derived from its own records', async () => { const data = status(await api('/api/dashboard/pri/live', { account: a }), 200); assert.equal(data.interviewScore, 0); assert.ok(Number.isFinite(data.score)); });
  await check('Dashboard', 'client-supplied scores cannot inflate PRI', async () => status(await api('/api/dashboard/pri/today', { method: 'PUT', account: a, body: { interviewScore: 100, resumeScore: 100, algoRankScore: 100 } }), 400));
  await check('Dashboard', 'repeated daily snapshot creates one UTC-day record', async () => { status(await api('/api/dashboard/pri/today', { method: 'PUT', account: a, body: {} }), 200); status(await api('/api/dashboard/pri/today', { method: 'PUT', account: a, body: {} }), 200); const data = status(await api('/api/dashboard/pri/history', { account: a }), 200); assert.equal(data.snapshots.length, 1); });
  await check('Dashboard', 'achievements return an owned collection', async () => status(await api('/api/achievements', { account: a }), 200));
  await check('Dashboard', 'learning recommendations load for a new account', async () => status(await api('/api/recommendations/learning-path', { account: a }), 200));

  await check('Resume', 'create a private resume with supplied owner ignored', async () => { const data = status(await api('/api/resume', { method: 'POST', account: a, body: { title: `${runId} Resume`, userId: b.id, skills: ['JavaScript'], personalInfo: { name: 'QA Candidate', email: a.email }, experience: [], education: [], projects: [] } }), 201); fixtures.resume = data; assert.equal(data.userId, a.id); });
  for (const method of ['GET', 'PUT', 'DELETE']) await check('Resume ownership', `other account cannot ${method} private resume`, async () => { need('resume'); status(await api(`/api/resume/${fixtures.resume.id}`, { method, account: b, ...(method === 'PUT' ? { body: { title: 'Not allowed' } } : {}) }), [403, 404]); });
  await check('Resume ownership', 'other account cannot duplicate private resume', async () => { need('resume'); status(await api(`/api/resume/${fixtures.resume.id}/duplicate`, { method: 'POST', account: b }), [403, 404]); });
  await check('Resume validation', 'malformed list fields are rejected', async () => status(await api('/api/resume', { method: 'POST', account: a, body: { title: 'QA malformed', skills: 'not-an-array' } }), 400));
  await check('Resume validation', 'malformed title is rejected without server failure', async () => status(await api('/api/resume', { method: 'POST', account: a, body: { title: { nested: 'bad' } } }), 400));
  await check('Resume', 'update survives reload and does not change ownership', async () => { need('resume'); const data = status(await api(`/api/resume/${fixtures.resume.id}`, { method: 'PUT', account: a, body: { title: 'Updated QA Resume', userId: b.id } }), 200); assert.equal(data.userId, a.id); assert.equal(status(await api(`/api/resume/${fixtures.resume.id}`, { account: a }), 200).title, 'Updated QA Resume'); });
  await check('Resume', 'duplicate creates an independent owned resume', async () => { need('resume'); const data = status(await api(`/api/resume/${fixtures.resume.id}/duplicate`, { method: 'POST', account: a }), 201); assert.notEqual(data.id, fixtures.resume.id); assert.equal(data.userId, a.id); status(await api(`/api/resume/${data.id}`, { method: 'DELETE', account: a }), 200); });
  await check('Resume PDF', 'owner receives a real PDF document', async () => { need('resume'); const data = await api(`/api/pdf/${fixtures.resume.id}/pdf`, { method: 'POST', account: a, binary: true }); status(data, 200); assert.match(data.type || '', /application\/pdf/); assert.equal(data.bytes.subarray(0, 5).toString(), '%PDF-'); fs.writeFileSync(path.resolve('../work/functional-resume.pdf'), data.bytes); });
  await check('Resume PDF', 'foreign resume PDF export is denied', async () => { need('resume'); status(await api(`/api/pdf/${fixtures.resume.id}/pdf`, { method: 'POST', account: b }), [403, 404]); });
  await check('Resume AI', 'ATS requires a job description', async () => { need('resume'); status(await api('/api/ai/ats-score', { method: 'POST', account: a, body: { resumeId: fixtures.resume.id } }), 400); });
  await check('Resume AI', 'foreign resume ATS is denied', async () => { need('resume'); status(await api('/api/ai/ats-score', { method: 'POST', account: b, body: { resumeId: fixtures.resume.id, jobDescription: 'JavaScript developer' } }), [403, 404]); });
  await check('Resume AI', 'cover letter rejects impossible dates', async () => { need('resume'); status(await api('/api/ai/cover-letter', { method: 'POST', account: a, body: { resumeId: fixtures.resume.id, companyName: 'QA Example', letterDate: '2026-02-30' } }), 400); });
  await check('Resume AI', 'ATS returns a bounded score and suggestions', async () => { need('resume'); const data = status(await api('/api/ai/ats-score', { method: 'POST', account: a, body: { resumeId: fixtures.resume.id, jobDescription: 'JavaScript frontend developer building accessible web applications.' } }), 200); assert.ok(data.score >= 0 && data.score <= 100); assert.ok(Array.isArray(data.suggestions)); });
  await check('Resume AI', 'cover letter includes the selected date', async () => { need('resume'); const data = status(await api('/api/ai/cover-letter', { method: 'POST', account: a, body: { resumeId: fixtures.resume.id, companyName: 'QA Example', jobTitle: 'Frontend Developer', letterDate: '2026-10-30' } }), 200); assert.match(data.coverLetter, /^October 30, 2026/); });

  await check('Roadmaps', 'templates are publicly readable', async () => { const data = status(await api('/api/roadmaps/templates'), 200); assert.ok(data.templates.length > 0); fixtures.template = data.templates[0]; });
  await check('Roadmaps', 'missing title or role is rejected', async () => status(await api('/api/roadmaps', { method: 'POST', account: a, body: {} }), 400));
  await check('Roadmaps', 'create private roadmap', async () => { need('template'); fixtures.roadmap = status(await api('/api/roadmaps', { method: 'POST', account: a, body: { title: `${runId} Roadmap`, roleType: fixtures.template.key, topics: [] } }), 201).roadmap; });
  for (const method of ['GET', 'PUT', 'DELETE']) await check('Roadmap ownership', `other account cannot ${method} private roadmap`, async () => { need('roadmap'); status(await api(`/api/roadmaps/${fixtures.roadmap.id}`, { method, account: b, ...(method === 'PUT' ? { body: { title: 'Not allowed' } } : {}) }), [403, 404]); });
  await check('Roadmaps', 'invalid typed title is a client error', async () => status(await api('/api/roadmaps', { method: 'POST', account: a, body: { title: {}, roleType: 'frontend' } }), 400));
  await check('Roadmaps', 'add two milestones and compute progress', async () => { need('roadmap'); const id = fixtures.roadmap.id; fixtures.milestone = status(await api(`/api/roadmaps/${id}/milestones`, { method: 'POST', account: a, body: { title: 'QA JavaScript', order: 1, topics: ['JavaScript'] } }), 201).milestone; status(await api(`/api/roadmaps/${id}/milestones`, { method: 'POST', account: a, body: { title: 'QA APIs', order: 2 } }), 201); status(await api(`/api/roadmaps/${id}/milestones/${fixtures.milestone.id}/complete`, { method: 'PUT', account: a }), 200); assert.equal(status(await api(`/api/roadmaps/${id}`, { account: a }), 200).roadmap.progress, 50); });
  await check('Roadmaps', 'other account cannot complete an owned milestone', async () => { need('roadmap', 'milestone'); status(await api(`/api/roadmaps/${fixtures.roadmap.id}/milestones/${fixtures.milestone.id}/complete`, { method: 'PUT', account: b }), [403, 404]); });
  await check('Roadmaps', 'recommendations are owner scoped', async () => { need('roadmap'); status(await api(`/api/recommendations/problems/${fixtures.roadmap.id}`, { account: b }), [403, 404]); });

  await check('AlgoRank browsing', 'problem list loads without code execution', async () => { const data = status(await api('/api/algorank/problems?limit=1'), 200); assert.ok(data.problems.length); fixtures.problem = data.problems[0]; });
  await check('AlgoRank browsing', 'problem search handles hostile text safely', async () => { const data = status(await api('/api/algorank/problems?search='+encodeURIComponent("' OR 1=1 -- <script>")), 200); assert.ok(Array.isArray(data.problems)); });
  await check('AlgoRank playlists', 'create a private owned playlist', async () => { fixtures.playlist = status(await api('/api/algorank/playlists', { method: 'POST', account: a, body: { title: `${runId} Playlist` } }), 201).playlist; });
  for (const method of ['GET', 'DELETE']) await check('AlgoRank playlists', `other account cannot ${method} a private playlist`, async () => { need('playlist'); status(await api(`/api/algorank/playlists/${fixtures.playlist.id}`, { method, account: b }), [403, 404]); });
  await check('AlgoRank playlists', 'adding a problem twice does not duplicate it', async () => { need('playlist', 'problem'); const route = `/api/algorank/playlists/${fixtures.playlist.id}/problems`; for(let i=0;i<2;i++) status(await api(route, { method: 'POST', account: a, body: { problemIds: [fixtures.problem.id] } }), 200); assert.equal(status(await api(`/api/algorank/playlists/${fixtures.playlist.id}`, { account: a }), 200).playlist.problems.length, 1); });
  await check('AlgoRank comments', 'blank comments are rejected', async () => { need('problem'); status(await api('/api/algorank/comments', { method: 'POST', account: a, body: { problemId: fixtures.problem.id, content: '   ' } }), 400); });
  await check('AlgoRank comments', 'create own comment and deny foreign deletion', async () => { need('problem'); const comment = status(await api('/api/algorank/comments', { method: 'POST', account: a, body: { problemId: fixtures.problem.id, content: `${runId} comment` } }), 201).comment; status(await api(`/api/algorank/comments/${comment.id}`, { method: 'DELETE', account: b }), [403, 404]); status(await api(`/api/algorank/comments/${comment.id}`, { method: 'DELETE', account: a }), 200); });
  await check('AlgoRank browsing', 'leaderboard and own ranking load', async () => { status(await api('/api/algorank/leaderboard'), 200); status(await api('/api/algorank/ranking/me', { account: a }), 200); });

  await check('Mentor approval', 'mentor signup remains a pending user', async () => { need('mentor'); assert.equal(fixtures.mentor.role, 'USER'); assert.equal(fixtures.mentor.isAlumniMentor, false); assert.equal(fixtures.mentor.mentorApprovalStatus, 'PENDING'); });
  await check('Mentor approval', 'profile save cannot self-approve', async () => { need('mentor'); const data = status(await api('/api/connect/profile', { method: 'POST', account: fixtures.mentor, body: { title: `${runId} Mentor`, company: 'QA Example', domain: 'Testing', bio: 'Temporary functional test mentor', role: 'ADMIN', mentorApprovalStatus: 'APPROVED', isAlumniMentor: true } }), 200); assert.equal(data.mentorApprovalStatus, 'PENDING'); assert.equal(data.user.role, 'USER'); assert.equal(data.user.isAlumniMentor, false); });
  await check('Mentor approval', 'pending mentor cannot publish availability', async () => { need('mentor'); status(await api('/api/connect/availability', { method: 'POST', account: fixtures.mentor, body: { date: futureDate(), startTime: '10:00', endTime: '10:45' } }), 403); });
  await check('Mentor approval', 'pending mentor is not publicly discoverable', async () => { need('mentor'); const data = status(await api('/api/connect/seniors?search='+encodeURIComponent(runId)), 200); assert.ok(!data.some((entry) => entry.userId === fixtures.mentor.id)); });
  await check('Admin review', 'prepare administrator only on a newly created test account', async () => { const account = await register('review-admin'); const own = await db.user.findFirst({ where: { id: account.id, email: account.email }, select: { id: true } }); assert.ok(own); await db.user.update({ where: { id: account.id }, data: { role: 'ADMIN' } }); const data = status(await api('/api/auth/login', { method: 'POST', body: { email: account.email, password, accountType: 'ADMIN' } }), 200); fixtures.admin = { ...account, token: data.token }; });
  await check('Admin review', 'administrator can see and approve pending application', async () => { need('mentor','admin'); const list = status(await api('/api/connect/admin/mentor-applications', { account: fixtures.admin }), 200); assert.ok(list.some((entry) => entry.id === fixtures.mentor.id)); status(await api(`/api/connect/admin/mentor-applications/${fixtures.mentor.id}`, { method: 'PATCH', account: fixtures.admin, body: { decision: 'approve' } }), 200); const data = status(await api('/api/auth/login', { method: 'POST', body: { email: fixtures.mentor.email, password, accountType: 'MENTOR' } }), 200); fixtures.mentor.token = data.token; });
  await check('Admin review', 'duplicate approval cannot silently alter the application', async () => { need('mentor','admin'); status(await api(`/api/connect/admin/mentor-applications/${fixtures.mentor.id}`, { method: 'PATCH', account: fixtures.admin, body: { decision: 'approve' } }), [404,409]); });
  await check('Mentor approval', 'approved profile edit preserves approval', async () => { need('mentor'); const data = status(await api('/api/connect/profile', { method: 'PUT', account: fixtures.mentor, body: { title: `${runId} Mentor` } }), 200); assert.equal(data.mentorApprovalStatus, 'APPROVED'); });
  await check('Mentor approval', 'partial profile edit preserves unrelated saved fields', async () => { need('mentor'); const data = status(await api('/api/connect/profile', { account: fixtures.mentor }), 200); assert.equal(data.company, 'QA Example'); assert.equal(data.bio, 'Temporary functional test mentor'); });
  await check('Mentor role', 'mentor is denied candidate modules', async () => { need('mentor'); for(const route of ['/api/resume','/api/roadmaps','/api/interview/sessions','/api/dashboard/pri/live']) status(await api(route, { account: fixtures.mentor }), 403); });

  await mentorshipChecks(a, b);
  await schedulingChecks(a, b);
  await interviewChecks(a, b);
}

async function mentorshipChecks(a, b) {
  await check('Availability', 'reject slots in the past', async () => { need('mentor'); status(await api('/api/connect/availability', { method: 'POST', account: fixtures.mentor, body: { date: futureDate(-3), startTime: '10:00', endTime: '10:45' } }), 400); });
  await check('Availability', 'reject reversed time ranges', async () => { need('mentor'); status(await api('/api/connect/availability', { method: 'POST', account: fixtures.mentor, body: { date: futureDate(), startTime: '11:00', endTime: '10:00' } }), 400); });
  await check('Availability', 'create a future slot', async () => { need('mentor'); fixtures.slot = status(await api('/api/connect/availability', { method: 'POST', account: fixtures.mentor, body: { date: futureDate(), startTime: '10:00', endTime: '10:45', timezone:'UTC' } }), 201)[0]; });
  await check('Availability', 'overlapping availability is rejected', async () => { need('mentor','slot'); status(await api('/api/connect/availability', { method: 'POST', account: fixtures.mentor, body: { date: futureDate(), startTime: '10:15', endTime: '10:50', timezone:'UTC' } }), 409); });
  await check('Bookings', 'mentor cannot book themselves', async () => { need('mentor','slot'); status(await api('/api/connect/sessions', { method: 'POST', account: fixtures.mentor, body: bookingBody() }), 403); });
  await check('Bookings', 'past booking is rejected', async () => { need('mentor'); status(await api('/api/connect/sessions', { method: 'POST', account: a, body: { seniorId: fixtures.mentor.id, topic:'QA', scheduledTime: futureDate(-2)+'T10:00:00Z' } }), 400); });
  await check('Bookings', 'student can book the chosen slot', async () => { need('mentor','slot'); fixtures.booking = status(await api('/api/connect/sessions', { method:'POST', account:a, body:bookingBody() }),201); });
  await check('Bookings', 'duplicate slot booking is rejected', async () => { need('booking'); status(await api('/api/connect/sessions',{method:'POST',account:a,body:bookingBody()}),409); });
  await check('Bookings', 'student cannot accept their own booking', async () => { need('booking'); status(await api(`/api/connect/sessions/${fixtures.booking.id}/status`,{method:'PUT',account:a,body:{status:'accepted'}}),403); });
  await check('Bookings', 'outsider cannot read chat or change booking', async () => { need('booking'); status(await api(`/api/connect/sessions/${fixtures.booking.id}/messages`,{account:b}),[403,404]); status(await api(`/api/connect/sessions/${fixtures.booking.id}`,{method:'DELETE',account:b}),[403,404]); });
  await check('Bookings', 'mentor accepts a pending booking', async () => { need('booking','mentor'); status(await api(`/api/connect/sessions/${fixtures.booking.id}/status`,{method:'PUT',account:fixtures.mentor,body:{status:'accepted'}}),200); });
  await check('Feedback', 'feedback before completion is rejected', async () => { need('booking'); status(await api(`/api/connect/sessions/${fixtures.booking.id}/feedback`,{method:'POST',account:a,body:{rating:5}}),[400,409]); });
  await check('Chat', 'blank messages are rejected', async () => { need('booking'); status(await api(`/api/connect/sessions/${fixtures.booking.id}/messages`,{method:'POST',account:a,body:{message:'   '}}),400); });
  await check('Chat', 'participant message persists and notifies counterpart', async () => { need('booking','mentor'); status(await api(`/api/connect/sessions/${fixtures.booking.id}/messages`,{method:'POST',account:a,body:{message:`${runId} message <script>not executable</script>`}}),201); const messages=status(await api(`/api/connect/sessions/${fixtures.booking.id}/messages`,{account:fixtures.mentor}),200); assert.ok(messages.some((entry)=>entry.message.includes(runId))); });
  await check('Bookings', 'participant can complete a session', async () => { need('booking'); status(await api(`/api/connect/sessions/${fixtures.booking.id}/complete`,{method:'POST',account:a}),200); });
  await check('Bookings', 'double completion cannot count the meeting twice', async () => { need('booking'); const result=await api(`/api/connect/sessions/${fixtures.booking.id}/complete`,{method:'POST',account:a}); status(result,[200,400,409]); const profile=status(await api('/api/connect/profile',{account:fixtures.mentor}),200); assert.equal(profile.sessionCount,1); });
  await check('Feedback', 'out-of-range rating is rejected', async () => { need('booking'); status(await api(`/api/connect/sessions/${fixtures.booking.id}/feedback`,{method:'POST',account:a,body:{rating:999}}),400); });
  await check('Feedback', 'completed-session feedback persists exactly once', async () => { need('booking'); status(await api(`/api/connect/sessions/${fixtures.booking.id}/feedback`,{method:'POST',account:a,body:{rating:5,comment:'Temporary QA feedback'}}),201); status(await api(`/api/connect/sessions/${fixtures.booking.id}/feedback`,{method:'POST',account:a,body:{rating:5}}),409); });
  await check('Notifications', 'outsider cannot read another account notification', async () => { need('mentor'); const list=status(await api('/api/connect/notifications',{account:fixtures.mentor}),200); if(!list.length)throw Object.assign(new Error('No fixture notification'),{blocked:true}); status(await api(`/api/connect/notifications/${list[0].id}/read`,{method:'PUT',account:b}),[403,404]); });
  await check('Notifications', 'own mark-all-read clears unread count', async () => { need('mentor'); status(await api('/api/connect/notifications/read-all',{method:'PUT',account:fixtures.mentor}),200); assert.equal(status(await api('/api/connect/notifications/count',{account:fixtures.mentor}),200).unreadCount,0); });
}

function bookingBody(){return {seniorId:fixtures.mentor.id,availabilitySlotId:fixtures.slot.id,scheduledTime:futureDate()+'T10:00:00Z',duration:45,topic:'Temporary functional QA booking'};}

async function schedulingChecks(a,b){
  const m=fixtures.mentor;if(!m)return;
  await check('Availability atomicity','invalid bulk request leaves no partial slots',async()=>{
    const before=status(await api('/api/connect/availability',{account:m}),200).length;
    status(await api('/api/connect/availability',{method:'POST',account:m,body:{slots:[{date:futureDate(7),startTime:'10:00',endTime:'10:45',timezone:'UTC'},{date:futureDate(7),startTime:'12:00',endTime:'11:00',timezone:'UTC'}]}}),400);
    assert.equal(status(await api('/api/connect/availability',{account:m}),200).length,before);
  });
  await check('Availability validation','malformed time and timezone are rejected',async()=>{
    for(const body of [{date:futureDate(8),startTime:'27:00',endTime:'28:00',timezone:'UTC'},{date:futureDate(8),startTime:'10:00',endTime:'10:45',timezone:'Unknown/Place'}])status(await api('/api/connect/availability',{method:'POST',account:m,body}),400);
  });
  await check('Scheduling timezone','slot retains its timezone in public booking data',async()=>{
    fixtures.zonedSlot=status(await api('/api/connect/availability',{method:'POST',account:m,body:{date:futureDate(9),startTime:'10:00',endTime:'10:45',timezone:'Asia/Kolkata'}}),201)[0];
    const slots=status(await api('/api/connect/availability/'+m.id),200);assert.equal(slots.find(s=>s.id===fixtures.zonedSlot.id).timezone,'Asia/Kolkata');
  });
  await check('Booking concurrency','two students racing for one zoned slot produce one booking',async()=>{
    need('zonedSlot'); const body={seniorId:m.id,availabilitySlotId:fixtures.zonedSlot.id,scheduledTime:futureDate(9)+'T04:30:00Z',duration:45,topic:'QA concurrent booking'};
    const responses=await Promise.all([api('/api/connect/sessions',{method:'POST',account:a,body}),api('/api/connect/sessions',{method:'POST',account:b,body})]);
    assert.deepEqual(responses.map(r=>r.status).sort(),[201,409]);const index=responses.findIndex(r=>r.status===201);fixtures.raceBooking=responses[index].data;fixtures.raceStudent=index===0?a:b;fixtures.raceOutsider=index===0?b:a;
  });
  await check('Rescheduling','accepted sessions keep original time pending approval',async()=>{
    need('raceBooking');const id=fixtures.raceBooking.id;
    status(await api(`/api/connect/sessions/${id}/status`,{method:'PUT',account:m,body:{status:'accepted'}}),200);
    const data=status(await api(`/api/connect/sessions/${id}/reschedule`,{method:'PUT',account:fixtures.raceStudent,body:{scheduledTime:futureDate(10)+'T10:00:00Z',duration:45}}),202);
    assert.equal(data.session.scheduledTime,fixtures.raceBooking.scheduledTime);
  });
  await check('Rescheduling','duplicate pending request rejected and mark-all-read preserves required action',async()=>{
    need('raceBooking');const id=fixtures.raceBooking.id;
    status(await api(`/api/connect/sessions/${id}/reschedule`,{method:'PUT',account:fixtures.raceStudent,body:{scheduledTime:futureDate(10)+'T11:00:00Z'}}),409);
    status(await api('/api/connect/notifications/read-all',{method:'PUT',account:m}),200);
    assert.ok(status(await api('/api/connect/notifications',{account:m}),200).some(n=>n.type==='session_reschedule_request'&&!n.isRead&&n.data?.bookingId===id));
  });
  await check('Rescheduling','requester and outsider cannot approve a request',async()=>{
    need('raceBooking');for(const account of [fixtures.raceStudent,fixtures.raceOutsider])status(await api(`/api/connect/sessions/${fixtures.raceBooking.id}/reschedule/decision`,{method:'PUT',account,body:{decision:'approve'}}),[403,404]);
  });
  await check('Rescheduling','counterpart approves and cannot approve twice',async()=>{
    need('raceBooking');const route=`/api/connect/sessions/${fixtures.raceBooking.id}/reschedule/decision`;
    const result=status(await api(route,{method:'PUT',account:m,body:{decision:'approve'}}),200);assert.equal((result.session||result).scheduledTime,futureDate(10)+'T10:00:00.000Z');
    status(await api(route,{method:'PUT',account:m,body:{decision:'approve'}}),[404,409]);
  });
  await check('LiveKit authorization','outsider cannot request a meeting token',async()=>{
    need('raceBooking');status(await api(`/api/connect/sessions/${fixtures.raceBooking.id}/livekit-token`,{account:fixtures.raceOutsider}),[403,404]);
  });
}

async function interviewChecks(a,b){
  for(const [name,body] of [['empty topics',{topics:[]}],['invalid type',{topics:['QA'],type:'admin'}],['invalid difficulty',{topics:['QA'],difficulty:'impossible'}],['null consent',{topics:['QA'],consent:null}]]) await check('Interview validation',name,async()=>status(await api('/api/interview/sessions',{method:'POST',account:a,body}),400));
  await check('Interview','create owned text-only session',async()=>{fixtures.interview=status(await api('/api/interview/sessions',{method:'POST',account:a,body:{topics:['Database indexing'],type:'technical',plannedDuration:5,consent:{camera:false,microphone:false}}}),201).session;});
  for(const [method,suffix,body] of [['GET','',undefined],['DELETE','',undefined],['PATCH','',{status:'abandoned'}],['POST','/questions',{}],['POST','/evaluate',{}],['POST','/analysis/text',{text:'Not allowed'}]]) await check('Interview ownership',`outsider ${method} ${suffix||'session'} denied`,async()=>{need('interview');status(await api(`/api/interview/sessions/${fixtures.interview.id}${suffix}`,{method,account:b,body}),404);});
  await check('Interview consent','camera analysis without consent is rejected',async()=>{need('interview');status(await api(`/api/interview/sessions/${fixtures.interview.id}/analysis/face`,{method:'POST',account:a,body:{}}),403);});
  await check('Interview consent','transcription without microphone consent is rejected',async()=>{need('interview');status(await api(`/api/interview/sessions/${fixtures.interview.id}/analysis/transcribe`,{method:'POST',account:a,body:{}}),403);});
  await check('Interview lifecycle','empty session cannot be evaluated',async()=>{need('interview');status(await api(`/api/interview/sessions/${fixtures.interview.id}/evaluate`,{method:'POST',account:a,body:{}}),400);});
  await check('Interview lifecycle','generate real questions and avoid repeats on retry',async()=>{need('interview');const route=`/api/interview/sessions/${fixtures.interview.id}/questions`;const first=status(await api(route,{method:'POST',account:a,body:{}}),201);fixtures.question=first.session.questions[0];const retry=status(await api(route,{method:'POST',account:a,body:{}}),200);assert.deepEqual(retry.session.questions.map(q=>q.id),first.session.questions.map(q=>q.id));});
  await check('Interview answers','blank answer is rejected',async()=>{need('question');status(await api(`/api/interview/questions/${fixtures.question.id}/answer`,{method:'PUT',account:a,body:{answerText:'   '}}),400);});
  await check('Interview answers','foreign answer write is rejected',async()=>{need('question');status(await api(`/api/interview/questions/${fixtures.question.id}/answer`,{method:'PUT',account:b,body:{answerText:'Not allowed'}}),404);});
  await check('Interview answers','real answer and live text emotion persist',async()=>{need('question','interview');status(await api(`/api/interview/questions/${fixtures.question.id}/answer`,{method:'PUT',account:a,body:{answerText:'An index improves lookup speed but costs storage and write performance. I compare selectivity and query plans before choosing one.'}}),200);const data=status(await api(`/api/interview/sessions/${fixtures.interview.id}`,{account:a}),200);assert.ok(data.session.questions[0].answerText);assert.ok(data.session.emotionResults.some(row=>row.modality==='text'&&row.result.source==='ml'));});
  await check('Interview evaluation','real AI feedback completes the session',async()=>{need('interview');const data=status(await api(`/api/interview/sessions/${fixtures.interview.id}/evaluate`,{method:'POST',account:a,body:{}}),200);assert.equal(data.session.status,'completed');assert.ok(data.session.feedback.overallScore>=0&&data.session.feedback.overallScore<=100);assert.ok(data.session.emotionResults.some(row=>row.modality==='fusion'));});
  await check('Interview lifecycle','completed answers cannot be edited',async()=>{need('question');status(await api(`/api/interview/questions/${fixtures.question.id}/answer`,{method:'PUT',account:a,body:{answerText:'Late tampering'}}),[404,409]);});
  await check('Interview lifecycle','completed session cannot be abandoned or analyzed',async()=>{need('interview');status(await api(`/api/interview/sessions/${fixtures.interview.id}`,{method:'PATCH',account:a,body:{status:'abandoned'}}),409);status(await api(`/api/interview/sessions/${fixtures.interview.id}/analysis/text`,{method:'POST',account:a,body:{text:'Late tampering'}}),409);});
  await check('Interview lifecycle','deletion removes questions and model records',async()=>{need('interview');const id=fixtures.interview.id;status(await api(`/api/interview/sessions/${id}`,{method:'DELETE',account:a}),200);status(await api(`/api/interview/sessions/${id}`,{account:a}),404);assert.equal(await db.interviewQuestion.count({where:{sessionId:id}}),0);assert.equal(await db.emotionResult.count({where:{sessionId:id}}),0);});
}

async function cleanup(){
  const owned=[];
  for(const account of accounts){const row=await db.user.findFirst({where:{id:account.id,email:account.email},select:{id:true}});if(row)owned.push(row.id);}
  if(createdBookings.size){const ids=[...createdBookings];await db.sessionFeedback.deleteMany({where:{bookingId:{in:ids}}});await db.sessionBooking.deleteMany({where:{id:{in:ids},juniorId:{in:owned},seniorId:{in:owned}}});}
  if(owned.length){await db.seniorProfile.deleteMany({where:{userId:{in:owned}}});await db.user.deleteMany({where:{id:{in:owned},email:{in:accounts.map(a=>a.email)}}});}
  const remaining=await db.user.count({where:{email:{in:accounts.map(a=>a.email)}}});assert.equal(remaining,0,'temporary accounts must be removed');
}

try{await run();}catch(error){results.push({module:'Runner',name:'fixture setup',status:'BLOCKED',message:error.message});}
finally{
  await check('Cleanup','remove only temporary accounts and their data',cleanup);
  fs.writeFileSync(output,JSON.stringify({runId,results},null,2));
  console.log(JSON.stringify({total:results.length,passed:results.filter(r=>r.status==='PASSED').length,failed:results.filter(r=>r.status==='FAILED').length,blocked:results.filter(r=>r.status==='BLOCKED').length}));
  await db.$disconnect();
}
