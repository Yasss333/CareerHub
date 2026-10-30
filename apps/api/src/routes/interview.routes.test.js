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
