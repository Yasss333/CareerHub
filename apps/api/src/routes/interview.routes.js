import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { validateInterviewEvaluation } from '../services/interview-evaluation.js';
import { requestInterviewAnalysis, getInterviewMlHealth } from '../services/interview-ml.service.js';
import { recordActivityStreak } from '../services/activity-streak.service.js';

export function createInterviewRouter({ database = new PrismaClient(), analyze = requestInterviewAnalysis, health = getInterviewMlHealth, completeJson, cleanupSession } = {}) {
  const router = express.Router();
  const prisma = database;
  const generationJobs = new Map();
  const JWT_SECRET = process.env.JWT_SECRET || 'careerhub-super-secret-jwt-key-2024';
  const ML_URL = (process.env.INTERVIEW_ML_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

  const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      if (typeof req.user?.id !== 'string' || !req.user.id.trim()) return res.status(401).json({ error: 'Invalid session identity' });
      return next();
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };

  const cleanList = (value, maxItems = 10, maxLength = 120) => Array.isArray(value)
    ? [...new Set(value.filter((item) => typeof item === 'string').map((item) => item.trim().slice(0, maxLength)).filter(Boolean))].slice(0, maxItems)
    : [];

  const ownedSession = (id, userId, include = {}) => prisma.interviewSession.findFirst({
    where: { id, userId },
    include: { questions: { orderBy: { questionIndex: 'asc' } }, emotionResults: { orderBy: { createdAt: 'asc' } }, proctoringEvents: { orderBy: { createdAt: 'asc' } }, ...include }
  });

  const parseJson = (content) => {
    const cleaned = String(content || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start < 0 || end < start) throw new Error('AI returned invalid JSON');
    return JSON.parse(cleaned.slice(start, end + 1));
  };

  const getAiClient = () => {
    const apiKey = process.env.OPENROUTER_API_KEY?.trim();
    if (!apiKey || /^(your|replace|placeholder|example|change.?me)/i.test(apiKey)) throw new Error('AI is not configured');
    return new OpenAI({ apiKey, baseURL: 'https://openrouter.ai/api/v1', timeout: 60000, maxRetries: 1 });
  };

  const chatJson = async (system, prompt, maxTokens = 3000, temperature = 0.4) => {
    if (completeJson) return completeJson(system, prompt);
    const client = getAiClient();
    const response = await client.chat.completions.create({
      model: process.env.MODEL_NAME || 'openai/gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens
    });
    return parseJson(response.choices[0]?.message?.content);
  };

  const requireOwned = async (req, res, include = {}) => {
    const session = await prisma.interviewSession.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { questions: { orderBy: { questionIndex: 'asc' } }, ...include }
    });
    if (!session) res.status(404).json({ error: 'Interview session not found' });
    return session;
  };

  const clearMlSession = async (sessionId) => {
    if (cleanupSession) return cleanupSession(sessionId);
    if (!process.env.INTERVIEW_ML_TOKEN) return;
    try {
      await fetch(`${ML_URL}/proctor/session/${encodeURIComponent(sessionId)}`, {
        method: 'DELETE',
        headers: { 'X-Interview-Service-Token': process.env.INTERVIEW_ML_TOKEN },
        signal: AbortSignal.timeout(3000)
      });
    } catch (error) {
      console.warn('Could not clear ephemeral face verification state:', error.message);
    }
  };

  const savedFusionInputs = (session) => Object.fromEntries(['face', 'voice', 'text'].map((modality) => {
    const consented = modality === 'text' || (modality === 'face' ? session.cameraConsentAt : session.microphoneConsentAt);
    const signal = consented && (session.emotionResults || []).filter((row) => row.modality === modality && row.result?.source === 'ml' && row.result.success === true).at(-1);
    return [modality, signal?.result?.predictions || null];
  }));

  const persistSavedFusion = async (session) => {
    const body = savedFusionInputs(session);
    if (!Object.values(body).some(Boolean)) return;
    const result = await analyze({ modality: 'fusion', sessionId: session.id, body });
    if (result.success) await prisma.emotionResult.create({ data: { sessionId: session.id, modality: 'fusion', result } });
  };

  router.post('/sessions', authenticate, async (req, res) => {
    try {
      const { type = 'custom', topics, role, experienceLevel, difficulty = 'medium', plannedDuration = 30, consent = {} } = req.body || {};
      const normalizedTopics = cleanList(topics, 10, 100);
      if (!normalizedTopics.length) return res.status(400).json({ error: 'Add at least one interview topic' });
      if (!['technical', 'behavioral', 'system_design', 'mixed', 'custom', 'quick'].includes(type)) return res.status(400).json({ error: 'Invalid interview type' });
      if (!['easy', 'medium', 'hard', 'mixed'].includes(difficulty)) return res.status(400).json({ error: 'Invalid difficulty' });
      const duration = Math.min(Math.max(Number.parseInt(plannedDuration, 10) || 30, 5), 120);
      if (!consent || typeof consent !== 'object' || Array.isArray(consent)) return res.status(400).json({ error: 'Invalid consent options' });
      const cameraEnabled = consent.camera === true;
      const microphoneEnabled = consent.microphone === true;
      const session = await prisma.interviewSession.create({
        data: {
          userId: req.user.id,
          type,
          topics: normalizedTopics,
          role: typeof role === 'string' ? role.trim().slice(0, 150) || null : null,
          experienceLevel: typeof experienceLevel === 'string' ? experienceLevel.trim().slice(0, 80) || null : null,
          difficulty,
          plannedDuration: duration,
          cameraEnabled,
          cameraConsentAt: cameraEnabled ? new Date() : null,
          microphoneEnabled,
          microphoneConsentAt: microphoneEnabled ? new Date() : null,
          status: 'in_progress',
          modalityAvailability: { face: cameraEnabled, voice: microphoneEnabled, text: true }
        }
      });
      return res.status(201).json({ session });
    } catch (error) {
      console.error('Create interview session failed:', error);
      return res.status(500).json({ error: 'Could not create interview session' });
    }
  });

  router.get('/sessions', authenticate, async (req, res) => {
    try {
      const sessions = await prisma.interviewSession.findMany({
        where: { userId: req.user.id },
        include: { questions: { orderBy: { questionIndex: 'asc' } } },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      return res.json({ sessions });
    } catch (error) {
      console.error('List interview sessions failed:', error);
      return res.status(500).json({ error: 'Could not load interview history' });
    }
  });

  router.get('/sessions/:id', authenticate, async (req, res) => {
    try {
      const session = await ownedSession(req.params.id, req.user.id);
      if (!session) return res.status(404).json({ error: 'Interview session not found' });
      return res.json({ session });
    } catch (error) {
      console.error('Get interview session failed:', error);
      return res.status(500).json({ error: 'Could not load interview session' });
    }
  });

  router.post('/sessions/:id/questions', authenticate, async (req, res) => {
    try {
      const session = await requireOwned(req, res);
      if (!session) return;
      if (session.status !== 'in_progress') return res.status(409).json({ error: 'This interview is no longer active' });
      if (session.questions?.length) return res.json({ session: await ownedSession(session.id, req.user.id) });
      let job = generationJobs.get(session.id);
      const isNew = !job;
      if (!job) {
        job = (async () => {
          const count = Math.min(12, Math.max(3, Math.round(session.plannedDuration / 4)));

          // Retrieve previous questions for this candidate to prevent repeating the same questions
          const previous = await prisma.interviewQuestion.findMany({
            where: { session: { userId: req.user.id } },
            select: { questionText: true },
            take: 30,
            orderBy: { createdAt: 'desc' }
          });
          const previousList = previous.map((p) => p.questionText.trim()).filter(Boolean);
          const excludeInstruction = previousList.length
            ? `\nCRITICAL: DO NOT repeat, rephrase, or ask any of these previously asked questions:\n- ${previousList.slice(0, 15).join('\n- ')}`
            : '';

          const systemPrompt = 'You are an elite, natural technical and behavioral interviewer conducting an interactive video call. Generate engaging, varied, non-repetitive interview questions that test real-world depth and problem solving. Return valid JSON only.';
          const userPrompt = `Generate ${count} completely distinct, creative interview questions as JSON:
{"questions":[{"questionText":"...","questionType":"technical|behavioral|scenario|system_design|problem_solving","topic":"...","difficulty":"easy|medium|hard","expectedAnswerPoints":["..."],"evaluationCriteria":["..."]}]}.
Interview focus: ${session.type}.
Topics to assess: ${session.topics.join(', ')}.
Target role: ${session.role || 'Software Engineer'}.
Experience level: ${session.experienceLevel || 'Entry level'}.
Difficulty: ${session.difficulty}.
Ensure a balanced progression: start with an insightful technical warmup, advance into real-world debugging/architecture scenarios, and include a behavioral scenario. Make questions conversational and practical, like a real hiring manager.${excludeInstruction}`;

          const generated = await chatJson(systemPrompt, userPrompt, 3500, 0.75);
          if (!Array.isArray(generated.questions) || generated.questions.length < 1) throw new Error('AI returned no questions');
          const questionRows = generated.questions.slice(0, count).map((item, index) => ({
            sessionId: session.id,
            questionText: String(item.questionText || '').trim().slice(0, 2000),
            questionIndex: index,
            category: String(item.questionType || 'technical').slice(0, 60),
            questionType: String(item.questionType || 'technical').slice(0, 60),
            topic: String(item.topic || session.topics[index % session.topics.length]).slice(0, 120),
            difficulty: ['easy', 'medium', 'hard'].includes(item.difficulty) ? item.difficulty : session.difficulty,
            expectedAnswerPoints: cleanList(item.expectedAnswerPoints, 12, 300),
            evaluationCriteria: cleanList(item.evaluationCriteria, 12, 300)
          })).filter((item) => item.questionText);
          if (!questionRows.length) throw new Error('AI returned no usable questions');
          try {
            await prisma.$transaction(async (tx) => {
              const current = await tx.interviewSession.findFirst({ where: { id: session.id, userId: req.user.id }, include: { questions: true } });
              if (!current || current.status !== 'in_progress') throw new Error('Interview is no longer active');
              if (!current.questions.length) await tx.interviewQuestion.createMany({ data: questionRows });
            }, { isolationLevel: 'Serializable' });
          } catch (error) {
            if (error.code !== 'P2034' || !(await ownedSession(session.id, req.user.id))?.questions?.length) throw error;
          }
        })();
        generationJobs.set(session.id, job);
      }
      try { await job; }
      finally { if (generationJobs.get(session.id) === job) generationJobs.delete(session.id); }
      return res.status(isNew ? 201 : 200).json({ session: await ownedSession(session.id, req.user.id) });
    } catch (error) {
      console.error('Generate interview questions failed:', error);
      return res.status(error.message === 'AI is not configured' ? 503 : 502).json({ error: error.message === 'AI is not configured' ? 'AI question generation is not configured on the server' : 'Could not generate interview questions; please retry' });
    }
  });

  router.put('/questions/:id/answer', authenticate, async (req, res) => {
    try {
      const answerText = typeof req.body?.answerText === 'string' ? req.body.answerText.trim().slice(0, 12000) : '';
      if (!answerText) return res.status(400).json({ error: 'Write or dictate an answer first' });
      const question = await prisma.interviewQuestion.findFirst({ where: { id: req.params.id, session: { userId: req.user.id, status: 'in_progress' } }, include: { session: true } });
      if (!question) return res.status(404).json({ error: 'Interview question not found' });
      const updated = await prisma.interviewQuestion.update({ where: { id: question.id }, data: { answerText, answeredAt: new Date() } });
      try {
        const result = await analyze({ modality: 'text', sessionId: question.sessionId, body: { text: answerText } });
        if (result.success) await prisma.emotionResult.create({ data: { sessionId: question.sessionId, questionId: question.id, modality: 'text', result } });
      } catch { /* Optional model analysis must not prevent saving the candidate's answer. */ }
      return res.json({ question: updated });
    } catch (error) {
      console.error('Save interview answer failed:', error);
      return res.status(500).json({ error: 'Could not save your answer' });
    }
  });

  router.post('/sessions/:id/evaluate', authenticate, async (req, res) => {
    try {
      const session = await ownedSession(req.params.id, req.user.id);
      if (!session) return res.status(404).json({ error: 'Interview session not found' });
      if (session.status === 'completed') return res.json({ session });
      if (session.status !== 'in_progress') return res.status(409).json({ error: 'This interview is no longer active' });
      const answered = session.questions.filter((question) => question.answerText?.trim());
      if (!answered.length) return res.status(400).json({ error: 'Answer at least one question before finishing' });
      await persistSavedFusion(session).catch(() => undefined);
      const rawEvaluation = await chatJson('You are a constructive interview coach. Score only evidence in the candidate answer; never invent experience. Return JSON only.', `Evaluate these interview answers. Return {"overallScore":0,"overallFeedback":"...","strengths":["..."],"areasToImprove":["..."],"questionEvaluations":[{"questionId":"...","score":0,"feedback":"...","strengths":["..."],"improvements":["..."],"missedPoints":["..."]}]}. Scores must be integers 0-100. Questions and answers: ${JSON.stringify(answered.map((q) => ({ questionId: q.id, question: q.questionText, expectedAnswerPoints: q.expectedAnswerPoints, evaluationCriteria: q.evaluationCriteria, answer: q.answerText })))}.`, 4000);
      const evaluations = validateInterviewEvaluation(rawEvaluation, answered);
      const byId = new Map(evaluations.questionEvaluations.map((item) => [item.questionId, item]));
      await prisma.$transaction(async (tx) => {
        for (const question of answered) {
          const result = byId.get(question.id);
          if (result) await tx.interviewQuestion.update({ where: { id: question.id }, data: { questionFeedback: result } });
        }
        await tx.interviewSession.update({
          where: { id: session.id }, data: {
            status: 'completed', endedAt: new Date(), durationSeconds: Math.max(0, Math.floor((Date.now() - session.startedAt.getTime()) / 1000)),
            feedback: { overallScore: Math.max(0, Math.min(100, Number(evaluations.overallScore))), overallFeedback: String(evaluations.overallFeedback || ''), strengths: cleanList(evaluations.strengths), areasToImprove: cleanList(evaluations.areasToImprove) }
          }
        });
      });
      await recordActivityStreak(prisma, req.user.id).catch(() => undefined);
      await clearMlSession(session.id);
      return res.json({ session: await ownedSession(session.id, req.user.id) });
    } catch (error) {
      console.error('Evaluate interview failed:', error);
      return res.status(error.message === 'AI is not configured' ? 503 : 502).json({ error: error.message === 'AI is not configured' ? 'AI evaluation is not configured on the server' : 'Could not evaluate this interview; please retry' });
    }
  });

  router.get('/capabilities', authenticate, async (req, res) => {
    try { return res.json(await health()); }
    catch { return res.json({ available: false, face: false, voice: false, text: false, transcription: false, proctoring: false }); }
  });

  router.post('/sessions/:id/analysis/:modality', authenticate, upload.single('media'), async (req, res) => {
    try {
      const session = await requireOwned(req, res);
      if (!session) return;
      if (session.status !== 'in_progress') return res.status(409).json({ error: 'This interview is no longer active' });
      const modality = req.params.modality;
      if (['face', 'face-register', 'face-verify'].includes(modality) && !session.cameraConsentAt) return res.status(403).json({ error: 'Camera consent is required for face analysis' });
      if (['voice', 'transcribe'].includes(modality) && !session.microphoneConsentAt) return res.status(403).json({ error: 'Microphone consent is required for audio processing' });
      if (modality === 'fusion' && req.body?.face && !session.cameraConsentAt) return res.status(403).json({ error: 'Camera consent is required for face analysis' });
      if (modality === 'fusion' && req.body?.voice && !session.microphoneConsentAt) return res.status(403).json({ error: 'Microphone consent is required for voice analysis' });
      let questionId = null;
      if (typeof req.body?.questionId === 'string') {
        const question = await prisma.interviewQuestion.findFirst({ where: { id: req.body.questionId, sessionId: session.id } });
        if (!question) return res.status(404).json({ error: 'Interview question not found' });
        questionId = question.id;
      }
      const analysisBody = modality === 'fusion' ? savedFusionInputs(await ownedSession(session.id, req.user.id)) : req.body;
      const result = await analyze({ modality, sessionId: session.id, file: req.file, body: analysisBody });
      if (result.success === true && ['face', 'voice', 'text', 'fusion'].includes(modality)) {
        await prisma.emotionResult.create({ data: { sessionId: session.id, questionId, modality, result } });
      }
      if (['face-register', 'face-verify'].includes(modality)) {
        await prisma.proctoringEvent.create({
          data: {
            sessionId: session.id,
            eventType: modality === 'face-register' && result.status === 'VERIFIED' ? 'face_registered' : 'face_' + result.status.toLowerCase(),
            severity: ['UNAUTHORIZED_FACE', 'MULTIPLE_FACES'].includes(result.status) ? 'warning' : 'info',
            details: { source: 'ml', status: result.status, ...(typeof result.similarity === 'number' ? { similarity: result.similarity } : {}) },
          }
        });
      }
      return res.json({ result });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      console.error('Interview ML analysis failed:', error.message);
      return res.status(500).json({ error: 'Interview analysis encountered an issue' });
    }
  });

  router.post('/sessions/:id/proctor-events', authenticate, async (req, res) => {
    try {
      const session = await requireOwned(req, res);
      if (!session) return;
      if (session.status !== 'in_progress') return res.status(409).json({ error: 'This interview is no longer active' });
      if (!session.cameraConsentAt) return res.status(403).json({ error: 'Camera consent is required for proctoring events' });
      const eventType = typeof req.body?.eventType === 'string' ? req.body.eventType.trim().slice(0, 80) : '';
      if (!['camera_unavailable', 'camera_off', 'tab_hidden', 'window_blur'].includes(eventType)) return res.status(400).json({ error: 'Unsupported client event type' });
      const event = await prisma.proctoringEvent.create({
        data: {
          sessionId: session.id,
          eventType,
          severity: ['info', 'warning', 'critical'].includes(req.body?.severity) ? req.body.severity : 'info',
          details: undefined
        }
      });
      return res.status(201).json({ event });
    } catch (error) {
      console.error('Save proctoring event failed:', error);
      return res.status(500).json({ error: 'Could not save proctoring event' });
    }
  });

  router.patch('/sessions/:id', authenticate, async (req, res) => {
    try {
      const session = await requireOwned(req, res);
      if (!session) return;
      if (req.body?.status !== 'abandoned') return res.status(400).json({ error: 'Unsupported session transition' });
      if (session.status !== 'in_progress') return res.status(409).json({ error: 'This interview is no longer active' });
      await prisma.interviewSession.update({ where: { id: session.id }, data: { status: 'abandoned', endedAt: new Date() } });
      await clearMlSession(session.id);
      return res.json({ session: await ownedSession(session.id, req.user.id) });
    } catch { return res.status(500).json({ error: 'Could not end interview' }); }
  });

  router.delete('/sessions/:id', authenticate, async (req, res) => {
    try {
      const session = await requireOwned(req, res);
      if (!session) return;
      await clearMlSession(session.id);
      await prisma.interviewSession.delete({ where: { id: session.id } });
      return res.json({ success: true });
    } catch (error) {
      console.error('Delete interview session failed:', error);
      return res.status(500).json({ error: 'Could not delete interview session' });
    }
  });

  router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'Media exceeds the 10 MB limit' : 'Invalid media upload' });
    return next(error);
  });
  return router;
}

export default createInterviewRouter();
