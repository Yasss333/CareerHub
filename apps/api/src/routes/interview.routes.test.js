import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import { createInterviewRouter } from './interview.routes.js';

async function withApi(options, run) {
  const app = express();
  app.use(express.json());
  app.use('/interview', createInterviewRouter(options));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/interview`;
  const token = jwt.sign({ id: 'candidate-a' }, process.env.JWT_SECRET || 'careerhub-super-secret-jwt-key-2024');
  try { await run(url, { Authorization: `Bearer ${token}` }); }
  finally { await new Promise((resolve) => server.close(resolve)); }
}

const activeSession = { id: 'session-a', userId: 'candidate-a', status: 'in_progress', cameraConsentAt: null, microphoneConsentAt: null };
const database = (session = activeSession) => ({
  interviewSession: { findFirst: async ({ where }) => where.userId === session?.userId && where.id === session.id ? session : null },
  emotionResult: { create: () => assert.fail('must not persist unavailable or forbidden results') },
});

test('proctored creation requires explicit screen, camera and microphone consent', () => withApi({database: {interviewSession: {create: async ({data}) => data}}}, async (url, headers) => {
  const create = async body => fetch(`${url}/sessions`, {method: 'POST', headers: {...headers, 'Content-Type': 'application/json'}, body: JSON.stringify({topics: ['Databases'], monitoringMode: 'proctored', ...body})});
  for (const consent of [{}, {screen: true}, {camera: true, microphone: true}]) assert.equal((await create({consent})).status, 400);
  const response = await create({consent: {screen: true, camera: true, microphone: true}, introductionRequired: true}); assert.equal(response.status, 201);
  const {session} = await response.json(); assert.equal(session.monitoringMode, 'proctored'); assert.ok(session.screenConsentAt); assert.equal(session.introductionRequired, true);
}));
test('candidate introduction is owned, bounded, saved separately and rejects closed sessions', async () => {
  const session = {...activeSession, introductionRequired: true}; const db = database(session);
  db.interviewSession.updateMany = async ({data, where}) => {assert.equal(where.status, 'in_progress'); Object.assign(session, data); return {count: 1};};
  await withApi({database: db}, async (url, headers) => {
    const save = text => fetch(`${url}/sessions/session-a/introduction`, {method: 'PUT', headers: {...headers, 'Content-Type': 'application/json'}, body: JSON.stringify({text})});
    assert.equal((await save('')).status, 400); assert.equal((await save('x'.repeat(4001))).status, 400);
    assert.equal((await save('I am a backend engineer interested in reliable systems.')).status, 200);
    assert.ok(session.introductionCompletedAt); assert.equal(session.questions, undefined);
    session.status = 'completed'; assert.equal((await save('Another introduction')).status, 409);
  });
});
test('screen monitoring requires screen consent and stores only server-assigned client event metadata', async () => {
  const session = {...activeSession, screenConsentAt: new Date(), monitoringMode: 'proctored'}; const db = database(session); const rows = [];
  db.proctoringEvent = {findFirst: async ({where}) => rows.filter(r => typeof where.eventType === 'string' ? r.eventType === where.eventType : where.eventType.in.includes(r.eventType)).at(-1), count: async () => rows.length, create: async ({data}) => {rows.push({...data, createdAt: new Date()}); return rows.at(-1);}};
  await withApi({database: db}, async (url, headers) => {
    const event = type => fetch(`${url}/sessions/session-a/proctor-events`, {method: 'POST', headers: {...headers, 'Content-Type': 'application/json'}, body: JSON.stringify({eventType: type, severity: 'critical', details: {screenshot: 'private pixels'}})});
    assert.equal((await event('screen_started')).status, 201); assert.equal(rows[0].severity, 'info'); assert.deepEqual(rows[0].details, {source: 'client'});
    assert.equal((await event('screen_heartbeat')).status, 201);
    const duplicate = await event('screen_heartbeat'); assert.equal(duplicate.status,200); assert.equal((await duplicate.json()).duplicate,true); assert.equal(rows.length,2);
    assert.equal((await event('VERIFIED')).status, 400);
    session.screenConsentAt = null; assert.equal((await event('screen_stopped')).status, 403);
  });
});

test('analysis requires authentication', () => withApi({ database: database() }, async (url) => {
  const response = await fetch(`${url}/sessions/session-a/analysis/text`, { method: 'POST' });
  assert.equal(response.status, 401);
}));

test('an active owner can grant device consent without enabling the other device', async()=>{
  const session={...activeSession,cameraEnabled:false,microphoneEnabled:false};const db=database(session);
  db.interviewSession.updateMany=async({where,data})=>{assert.equal(where.userId,'candidate-a');assert.equal(where.status,'in_progress');Object.assign(session,data);return {count:1};};
  await withApi({database:db},async(url,headers)=>{
    const grant=body=>fetch(`${url}/sessions/session-a/consent`,{method:'PATCH',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(body)});
    assert.equal((await grant({camera:true})).status,200);assert.equal(session.cameraEnabled,true);assert.ok(session.cameraConsentAt instanceof Date);assert.equal(session.microphoneEnabled,false);
    const timestamp=session.cameraConsentAt;assert.equal((await grant({microphone:true})).status,200);assert.equal(session.microphoneEnabled,true);assert.ok(session.microphoneConsentAt instanceof Date);assert.equal(session.cameraConsentAt,timestamp);
    for(const body of [{camera:'true'},{camera:false},{},null,{camera:true,role:'ADMIN'}])assert.equal((await grant(body)).status,400);
  });
});

test('device consent cannot change a foreign or closed interview',async()=>{
  for(const session of [{...activeSession,userId:'candidate-b'},{...activeSession,status:'completed'},{...activeSession,status:'abandoned'}])await withApi({database:database(session)},async(url,headers)=>{
    const response=await fetch(`${url}/sessions/session-a/consent`,{method:'PATCH',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({camera:true})});assert.equal(response.status,session.userId==='candidate-b'?404:409);
  });
});

test('a signed token without a candidate id cannot bypass ownership scoping', () => withApi({ database: database() }, async (url) => {
  const token = jwt.sign({ role: 'USER' }, process.env.JWT_SECRET || 'careerhub-super-secret-jwt-key-2024');
  const response = await fetch(`${url}/sessions/session-a/analysis/text`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  assert.equal(response.status, 401);
}));

test('an unanswered owned interview can be ended without invented evaluation', async () => {
  const session = { ...activeSession, questions: [] };
  const db = database(session);
  db.interviewSession.update = async ({ data }) => Object.assign(session, data);
  await withApi({ database: db, cleanupSession: async () => undefined }, async (url, headers) => {
    const response = await fetch(`${url}/sessions/session-a`, { method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'abandoned' }) });
    assert.equal(response.status, 200);
    assert.equal(session.status, 'abandoned');
    assert.equal(session.feedback, undefined);
  });
});

test('analysis cannot access another candidate session', () => withApi({ database: database({ ...activeSession, userId: 'candidate-b' }) }, async (url, headers) => {
  const response = await fetch(`${url}/sessions/session-a/analysis/text`, { method: 'POST', headers });
  assert.equal(response.status, 404);
}));

test('transcription requires microphone consent before contacting ML', () => withApi({ database: database(), analyze: () => assert.fail('must not analyze') }, async (url, headers) => {
  const response = await fetch(`${url}/sessions/session-a/analysis/transcribe`, { method: 'POST', headers });
  assert.equal(response.status, 403);
}));

test('completed sessions cannot accept new analysis', () => withApi({ database: database({ ...activeSession, status: 'completed' }), analyze: () => assert.fail('must not analyze') }, async (url, headers) => {
  const response = await fetch(`${url}/sessions/session-a/analysis/text`, { method: 'POST', headers });
  assert.equal(response.status, 409);
}));

test('upstream failures are unavailable and never stored as successful predictions', () => withApi({
  database: database(), analyze: async () => { throw Object.assign(new Error('Analysis unavailable'), { status: 503 }); },
}, async (url, headers) => {
  const response = await fetch(`${url}/sessions/session-a/analysis/text`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'An answer' }) });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).result, undefined);
}));

test('transcription is returned without saving raw media as an emotion result', () => withApi({
  database: database({ ...activeSession, microphoneConsentAt: new Date() }), analyze: async () => ({ success: true, text: 'My answer' }),
}, async (url, headers) => {
  const form = new FormData();
  form.set('media', new Blob(['voice'], { type: 'audio/webm' }), 'answer.webm');
  const response = await fetch(`${url}/sessions/session-a/analysis/transcribe`, { method: 'POST', headers, body: form });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).result.text, 'My answer');
}));

test('fusion uses persisted model evidence instead of client-invented predictions', async () => {
  const db = database({ ...activeSession, emotionResults: [{ modality: 'text', result: { source: 'ml', success: true, predictions: { neutral: 0.8, sadness: 0.2 } } }] });
  db.emotionResult.create = async () => undefined;
  await withApi({ database: db, analyze: async ({ body }) => {
    assert.deepEqual(body.text, { neutral: 0.8, sadness: 0.2 });
    return { source: 'ml', success: true, emotions: body.text };
  } }, async (url, headers) => {
    const response = await fetch(`${url}/sessions/session-a/analysis/fusion`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ text: { happiness: 1 } }) });
    assert.equal(response.status, 200);
  });
});

test('session lifecycle saves answers, retries incomplete AI evaluation, and deletes owned data', async () => {
  let session;
  let questions = [];
  let emotions = [];
  let completeFeedback = false;
  let generatedCount = 0;
  const db = {
    interviewSession: {
      create: async ({ data }) => (session = { id: 'new-session', ...data, startedAt: new Date(), createdAt: new Date() }),
      findFirst: async ({ where }) => session && where.id === session.id && where.userId === session.userId ? { ...session, questions: [...questions], emotionResults: [...emotions], proctoringEvents: [] } : null,
      update: async ({ data }) => Object.assign(session, data),
      delete: async () => { session = null; questions = []; emotions = []; },
    },
    interviewQuestion: {
      findMany: async () => questions,
      createMany: async ({ data }) => { questions = data.map((row, i) => ({ ...row, id: `question-${i}` })); },
      findFirst: async ({ where }) => questions.find((question) => question.id === where.id) ? { ...questions.find((question) => question.id === where.id), session } : null,
      update: async ({ where, data }) => Object.assign(questions.find((question) => question.id === where.id), data),
    },
    emotionResult: { create: async ({ data }) => emotions.push(data) },
    user: { findUnique: async () => null },
    $transaction: async (callback) => callback(db),
  };
  await withApi({
    database: db, cleanupSession: async () => undefined,
    analyze: async () => ({ source: 'ml', success: true, emotion: 'neutral', predictions: { neutral: 1 } }),
    completeJson: async (system) => {
      if (system.includes('interviewer')) {
        generatedCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 30));
        return { questions: ['Indexing', 'Transactions', 'Caching'].map((topic) => ({ questionText: `Explain ${topic}`, topic })) };
      }
      return { overallScore: 72, overallFeedback: 'Explain the cost of each tradeoff.', questionEvaluations: completeFeedback ? [{ questionId: questions[0].id, score: 72, feedback: 'A useful explanation.' }] : [] };
    },
  }, async (url, headers) => {
    const send = (path, body, method = 'POST') => fetch(url + path, { method, headers: { ...headers, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    assert.equal((await send('/sessions', { topics: ['Databases'], plannedDuration: 10, consent: { camera: false, microphone: false } })).status, 201);
    assert.equal(session.cameraEnabled, false);
    const concurrent = await Promise.all([send('/sessions/new-session/questions', {}), send('/sessions/new-session/questions', {})]);
    assert.ok(concurrent.every((response) => [200, 201].includes(response.status)));
    assert.equal((await send('/sessions/new-session/questions', {})).status, 200);
    assert.equal(generatedCount, 1);
    assert.equal((await send('/questions/question-0/answer', { answerText: '' }, 'PUT')).status, 400);
    assert.equal((await send('/questions/question-0/answer', { answerText: 'An index reduces reads at the cost of writes.' }, 'PUT')).status, 200);
    assert.equal(emotions.length, 1);
    assert.equal((await send('/sessions/new-session/evaluate', {})).status, 502);
    assert.equal(session.status, 'in_progress');
    completeFeedback = true;
    assert.equal((await send('/sessions/new-session/evaluate', {})).status, 200);
    assert.equal(session.status, 'completed');
    assert.equal(questions[0].questionFeedback.score, 72);
    assert.equal((await send('/sessions/new-session/analysis/text', { text: 'late' })).status, 409);
    assert.equal((await send('/sessions/new-session', undefined, 'DELETE')).status, 200);
    assert.equal(questions.length, 0);
    assert.equal(emotions.length, 0);
    assert.equal((await send('/sessions/new-session', undefined, 'GET')).status, 404);
  });
});


test('correlated focus events are one incident, including concurrent lagged requests', async () => {
  const rows = []; const db = database({...activeSession, screenConsentAt: new Date()});
  db.proctoringEvent = {
    findFirst: async ({where}) => rows.filter(r => typeof where.eventType === 'string' ? r.eventType === where.eventType : where.eventType.in.includes(r.eventType)).at(-1),
    count: async () => rows.length,
    create: async ({data}) => {await new Promise(r => setTimeout(r, 20)); const row = {...data, id: String(rows.length), createdAt: new Date()}; rows.push(row); return row;}
  };
  await withApi({database: db}, async (url, headers) => {
    const responses = await Promise.all(['window_blur', 'tab_hidden', 'fullscreen_exited', 'window_blur', 'tab_hidden'].map(eventType => fetch(`${url}/sessions/session-a/proctor-events`, {method: 'POST', headers: {...headers, 'Content-Type': 'application/json'}, body: JSON.stringify({eventType})})));
    assert.ok(responses.every(r => r.ok)); assert.equal(rows.length, 1);
    rows[0].createdAt = new Date(Date.now() - 11000);
    assert.equal((await fetch(`${url}/sessions/session-a/proctor-events`, {method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({eventType:'tab_hidden'})})).status,201);
    assert.equal(rows.length, 2);
  });
});

test('downloadable PDF is owner-only and does not expose an incomplete report', async () => {
  const session = {...activeSession, status:'completed', questions:[], feedback:{overallScore:0}};
  await withApi({database:database(session), renderReport:async value => {assert.equal(value.id,session.id);return Buffer.from('%PDF-qa');}}, async (url,headers) => {
    const result = await fetch(`${url}/sessions/session-a/report.pdf`, {headers}); assert.equal(result.status,200); assert.match(result.headers.get('content-type'), /application\/pdf/); assert.match(result.headers.get('content-disposition'), /attachment/); assert.equal(await result.text(), '%PDF-qa');
    assert.equal((await fetch(`${url}/sessions/foreign/report.pdf`,{headers})).status,404);
    assert.equal((await fetch(`${url}/sessions/session-a/report.pdf`)).status,401);
    session.status='in_progress'; assert.equal((await fetch(`${url}/sessions/session-a/report.pdf`,{headers})).status,409);
  });
});


test('repeated face warnings count once and recovery permits a later incident', async () => {
  const rows=[];const db=database({...activeSession,cameraConsentAt:new Date()});
  db.proctoringEvent={findFirst:async({where})=>rows.filter(r=>where.eventType.in.includes(r.eventType)&&(!where.severity||r.severity===where.severity)).at(-1),count:async()=>rows.length,create:async({data})=>{const row={...data,id:String(rows.length),createdAt:new Date()};rows.push(row);return row;}};
  let status='MULTIPLE_FACES';await withApi({database:db,analyze:async()=>({status,success:status==='VERIFIED',source:'ml'})},async(url,headers)=>{
    const analyze=()=>fetch(`${url}/sessions/session-a/analysis/face-verify`,{method:'POST',headers});
    await Promise.all(Array.from({length:5},analyze));assert.equal(rows.filter(e=>e.severity==='warning').length,1);
    status='VERIFIED';await analyze();status='NO_FACE';await analyze();assert.equal(rows.filter(e=>e.severity==='warning').length,1,'brief classifier flips must not add incidents');
    rows[0].createdAt=new Date(Date.now()-11000);await analyze();assert.equal(rows.filter(e=>e.severity==='warning').length,2);
  });
});
