const paths = {
  face: '/predict/face', voice: '/predict/voice', text: '/predict/text', fusion: '/fusion',
  transcribe: '/transcribe', 'face-register': '/proctor/register', 'face-verify': '/proctor/verify',
};

export class InterviewMlError extends Error {
  constructor(message, status = 503) {
    super(message);
    this.status = status;
  }
}

const configuration = () => ({
  url: process.env.INTERVIEW_ML_URL || '', token: process.env.INTERVIEW_ML_TOKEN || '',
  discoveryMode: process.env.INTERVIEW_ML_DISCOVERY_MODE || 'schema',
  sessionScoped: process.env.INTERVIEW_ML_SESSION_SCOPED === 'true',
  timeout: Math.min(120000, Math.max(1000, Number(process.env.INTERVIEW_ML_TIMEOUT_MS) || 30000)),
});

function baseUrl(config) {
  try {
    const url = new URL(config.url);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    if (url.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error();
    return url.href.replace(/\/+$/, '');
  } catch {
    throw new InterviewMlError('Interview analysis service is not configured');
  }
}

async function fetchJson(url, options, config, fetchImpl) {
  try {
    const response = await fetchImpl(url, {
      ...options, redirect: 'error', signal: AbortSignal.timeout(config.timeout),
      headers: { ...(config.token ? { 'X-Interview-Service-Token': config.token } : {}), ...options?.headers },
    });
    if (!response.ok) throw new InterviewMlError('Interview analysis service is unavailable');
    return await response.json();
  } catch (error) {
    if (error instanceof InterviewMlError) throw error;
    throw new InterviewMlError('Interview analysis service is unavailable; you can continue with text answers');
  }
}

function hasSessionParameter(document, path) {
  const content = document?.paths?.[path]?.post?.requestBody?.content?.['multipart/form-data'];
  let schema = content?.schema;
  if (schema?.$ref?.startsWith('#/components/schemas/')) schema = document.components?.schemas?.[schema.$ref.split('/').pop()];
  return Boolean(schema?.properties?.session_id && schema?.required?.includes('session_id'));
}

export async function getInterviewMlHealth({ config = configuration(), fetchImpl = fetch } = {}) {
  const url = baseUrl(config);
  if (config.discoveryMode === 'direct') {
    // These flags enable attempts; individual inference responses establish actual availability.
    return { available: true, face: true, voice: true, text: true, transcription: true, proctoring: config.sessionScoped === true, sessionScoped: config.sessionScoped === true, discovery: 'configured' };
  }
  const health = await fetchJson(`${url}/health`, {}, config, fetchImpl);
  let sessionScoped = false;
  let transcription = false;
  try {
    const schema = await fetchJson(`${url}/openapi.json`, {}, config, fetchImpl);
    sessionScoped = hasSessionParameter(schema, '/proctor/register') && hasSessionParameter(schema, '/proctor/verify');
    transcription = Boolean(schema?.paths?.['/transcribe']?.post);
  } catch { /* Older services can still provide emotion analysis. */ }
  return {
    available: true,
    face: health.facial_model_loaded === true,
    voice: health.voice_model_loaded === true,
    text: health.text_model_loaded === true,
    proctoring: sessionScoped && (health.face_verifier_loaded === true || health.face_verification_loaded === true),
    sessionScoped, transcription,
  };
}

const probabilities = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const entries = Object.entries(value).filter(([key, score]) => key.length <= 60 && Number.isFinite(score) && score >= 0 && score <= 1).slice(0, 30);
  return entries.length ? Object.fromEntries(entries) : undefined;
};

// Allowlist derived output: embeddings, raw media, paths, and upstream error details never leave this boundary.
export function normalizeInterviewAnalysis(data, modality) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new InterviewMlError('Invalid interview analysis response');
  const proctor = modality.startsWith('face-');
  const statuses = ['VERIFIED', 'NO_FACE', 'MULTIPLE_FACES', 'UNAUTHORIZED_FACE'];
  if (proctor) {
    if (!statuses.includes(data.status)) throw new InterviewMlError('Face verification is unavailable');
    return {
      success: data.status === 'VERIFIED', source: 'ml', status: data.status, is_match: data.status === 'VERIFIED',
      ...(Number.isFinite(data.similarity) ? { similarity: data.similarity } : {}),
      ...(Number.isInteger(data.faces_detected) ? { faces_detected: data.faces_detected } : {}),
    };
  }
  if (data.skipped === true) return { success: false, skipped: true, reason: String(data.reason || 'frame_quality').slice(0, 80) };
  if (data.success === false || data.status === 'ERROR') throw new InterviewMlError('Interview analysis is currently unavailable');
  if (modality === 'transcribe') {
    if (typeof data.text !== 'string') throw new InterviewMlError('Transcription returned no text');
    return { success: true, text: data.text.trim().slice(0, 12000) };
  }
  const prediction = typeof data.emotion === 'object' ? data.emotion : data;
  const result = { success: true, source: 'ml' };
  if (typeof prediction?.emotion === 'string') result.emotion = prediction.emotion.slice(0, 60);
  if (Number.isFinite(prediction?.confidence) && prediction.confidence >= 0 && prediction.confidence <= 1) result.confidence = prediction.confidence;
  const distribution = probabilities(data.predictions || prediction?.predictions);
  if (distribution) result.predictions = distribution;
  if (modality === 'fusion') {
    if (typeof data.dominant_emotion === 'string') result.dominant_emotion = data.dominant_emotion.slice(0, 60);
    for (const key of ['emotions', 'weights']) {
      const value = probabilities(data[key]);
      if (value) result[key] = value;
    }
    const metrics = data.behavioral_metrics;
    if (metrics && typeof metrics === 'object') result.behavioral_metrics = Object.fromEntries(
      Object.entries(metrics).filter(([key, value]) => key.length <= 60 && Number.isFinite(value) && value >= 0 && value <= 100).slice(0, 20)
    );
    if (!result.emotions) throw new InterviewMlError('Fusion returned no emotion distribution');
  } else if (!result.emotion && !result.predictions) throw new InterviewMlError('Analysis returned no prediction');
  return result;
}

export async function requestInterviewAnalysis({ modality, sessionId, file, body = {} }, { config = configuration(), fetchImpl = fetch } = {}) {
  const endpoint = Object.hasOwn(paths, modality) ? paths[modality] : null;
  if (!endpoint) throw new InterviewMlError('Unsupported analysis modality', 400);
  const url = baseUrl(config);
  let requestBody;
  const headers = {};
  if (['text', 'fusion'].includes(modality)) {
    headers['Content-Type'] = 'application/json';
    if (modality === 'text') {
      if (typeof body.text !== 'string' || !body.text.trim()) throw new InterviewMlError('Text is required', 400);
      requestBody = JSON.stringify({ text: body.text.trim().slice(0, 12000) });
    } else {
      const inputs = Object.fromEntries(['face', 'voice', 'text'].map((key) => [key, probabilities(body[key]) || null]));
      if (!Object.values(inputs).some(Boolean)) throw new InterviewMlError('Fusion needs at least one emotion distribution', 400);
      requestBody = JSON.stringify(inputs);
    }
  } else {
    if (!file?.buffer?.length) throw new InterviewMlError('Media file is required', 400);
    const audio = ['voice', 'transcribe'].includes(modality);
    if (!(audio ? /^audio\// : /^image\//).test(file.mimetype || '')) throw new InterviewMlError('Unsupported media type', 415);
    if (modality.startsWith('face-')) {
      let isolated = config.sessionScoped === true;
      if (!isolated && config.discoveryMode !== 'direct') {
        const schema = await fetchJson(`${url}/openapi.json`, {}, config, fetchImpl);
        isolated = hasSessionParameter(schema, '/proctor/register') && hasSessionParameter(schema, '/proctor/verify');
      }
      if (!sessionId || !isolated) {
        throw new InterviewMlError('Face verification requires a session-isolated ML service');
      }
    }
    requestBody = new FormData();
    requestBody.set('file', new Blob([file.buffer], { type: file.mimetype }), audio ? 'answer.webm' : 'frame.jpg');
    if (modality.startsWith('face-')) requestBody.set('session_id', sessionId);
  }
  const data = await fetchJson(`${url}${endpoint}`, { method: 'POST', headers, body: requestBody }, config, fetchImpl);
  return normalizeInterviewAnalysis(data, modality);
}
