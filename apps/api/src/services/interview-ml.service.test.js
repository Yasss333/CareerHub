import test from 'node:test';
import assert from 'node:assert/strict';
import { requestInterviewAnalysis, getInterviewMlHealth } from './interview-ml.service.js';

const config = { url: 'https://ml.example.test', token: 'service-test-token', timeout: 1000 };
const file = { buffer: Buffer.from('test-media'), mimetype: 'image/jpeg' };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status });

test('a failed upstream never becomes a successful identity verification', async () => {
  await assert.rejects(requestInterviewAnalysis({ modality: 'face-verify', sessionId: 'session-a', file }, {
    config, fetchImpl: async () => { throw new Error('offline'); },
  }), { status: 503 });
});

test('placeholder ML URLs are unavailable without making a network request', async () => {
  await assert.rejects(requestInterviewAnalysis({ modality: 'text', body: { text: 'Hello' } }, {
    config: { ...config, url: 'ml' }, fetchImpl: () => assert.fail('must not fetch'),
  }), { status: 503 });
});

test('voice results retain the actual prediction instead of invented confidence', async () => {
  const result = await requestInterviewAnalysis({ modality: 'voice', file: { ...file, mimetype: 'audio/webm' } }, {
    config, fetchImpl: async (url, options) => {
      assert.equal(url, 'https://ml.example.test/predict/voice');
      assert.equal(options.headers['X-Interview-Service-Token'], config.token);
      return json({ success: true, emotion: { emotion: 'neutral', confidence: 0.63 }, predictions: { neutral: 0.63, happy: 0.37 } });
    },
  });
  assert.equal(result.emotion, 'neutral');
  assert.equal(result.confidence, 0.63);
});

test('rejects global face verification services without session isolation', async () => {
  await assert.rejects(requestInterviewAnalysis({ modality: 'face-register', sessionId: 'session-a', file }, {
    config, fetchImpl: async () => json({ paths: { '/proctor/register': { post: {} } } }),
  }), { status: 503 });
});

test('proctoring passes the server session id and removes biometric embeddings', async () => {
  const fetchImpl = async (url, options) => {
    if (url.endsWith('/openapi.json')) return json({
      paths: Object.fromEntries(['register', 'verify'].map((action) => [`/proctor/${action}`, { post: { requestBody: { content: { 'multipart/form-data': { schema: { properties: { session_id: { type: 'string' } }, required: ['session_id'] } } } } } }])),
    });
    assert.equal(options.body.get('session_id'), 'session-a');
    return json({ success: true, status: 'VERIFIED', embedding: [0.1, 0.2], is_match: true });
  };
  const result = await requestInterviewAnalysis({ modality: 'face-register', sessionId: 'session-a', file }, { config, fetchImpl });
  assert.equal(result.status, 'VERIFIED');
  assert.equal(result.embedding, undefined);
});

test('transcription returns real text without storing or inventing an emotion', async () => {
  const result = await requestInterviewAnalysis({ modality: 'transcribe', file: { ...file, mimetype: 'audio/webm' } }, {
    config, fetchImpl: async () => json({ success: true, text: 'I would use an index.', engine: 'whisper' }),
  });
  assert.equal(result.text, 'I would use an index.');
  assert.equal(result.emotion, undefined);
});

test('an upstream inference failure remains unavailable', async () => {
  await assert.rejects(requestInterviewAnalysis({ modality: 'text', body: { text: 'Hello' } }, {
    config, fetchImpl: async () => json({ success: false, error: 'model not loaded' }),
  }), { status: 503 });
});

test('a quality-gated frame is reported as skipped without fabricated predictions', async () => {
  const result = await requestInterviewAnalysis({ modality: 'face', file }, {
    config, fetchImpl: async () => json({ success: false, skipped: true, reason: 'no_face' }),
  });
  assert.equal(result.skipped, true);
  assert.equal(result.predictions, undefined);
});

test('the bundled ML service health and OpenAPI schema advertise session-safe proctoring', async () => {
  const document = { paths: Object.fromEntries(['register', 'verify'].map((action) => [`/proctor/${action}`, { post: { requestBody: { content: { 'multipart/form-data': { schema: { $ref: '#/components/schemas/ProctorBody' } } } } } }])), components: { schemas: { ProctorBody: { properties: { session_id: {} }, required: ['session_id'] } } } };
  const health = await getInterviewMlHealth({ config, fetchImpl: async (url) => json(url.endsWith('/health') ? { face_verification_loaded: true, facial_model_loaded: true } : document) });
  assert.equal(health.proctoring, true);
  assert.equal(health.face, true);
});

test('unknown analysis modalities cannot use inherited object properties as endpoints', async () => {
  await assert.rejects(requestInterviewAnalysis({ modality: '__proto__', file }, { config, fetchImpl: () => assert.fail('must not fetch') }), { status: 400 });
});

test('direct mode attempts known inference endpoints without health or schema probes', async () => {
  const direct = { ...config, token: '', discoveryMode: 'direct', sessionScoped: false };
  const capabilities = await getInterviewMlHealth({ config: direct, fetchImpl: () => assert.fail('must not probe health or schema') });
  assert.equal(capabilities.transcription, true);
  assert.equal(capabilities.proctoring, false);
  const result = await requestInterviewAnalysis({ modality: 'text', body: { text: 'A sample answer' } }, {
    config: direct, fetchImpl: async (url, options) => {
      assert.equal(url, 'https://ml.example.test/predict/text');
      assert.equal(options.headers['X-Interview-Service-Token'], undefined);
      return json({ success: true, emotion: 'neutral', confidence: 0.8 });
    },
  });
  assert.equal(result.emotion, 'neutral');
});
