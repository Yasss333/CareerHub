# AI mock interview integration

## Source and architecture

Reference: https://github.com/LuckyLalwani/ai-mock-interview-platform-2 at `34204e6` (cloned under `legacy/ai-mock-interview-platform-2`). The clone is a separate local repository and remains unchanged.

CareerHub keeps its existing JWT accounts, Express API, Prisma models, PostgreSQL database, and protected `/interview` routes. The reference's Supabase Auth, direct database writes, and Edge Functions are replaced by the CareerHub session APIs. Supabase credentials are not needed for this integration.

The integrated flow includes the eight Quick Mock presets, custom role/topic/difficulty/duration setup, explicit optional camera/microphone consent, spoken questions/avatar, browser speech recognition, server transcription fallback, typed answers, saved/resumable questions, answer evaluation, face/voice/text analysis, fusion, proctoring events, reports, history, and deletion. Only validated answer-evaluation scores contribute to dashboard PRI; zero scores count and affect estimates do not.

## Environment handoff

Set these in the **CareerHub API** environment (`apps/api/.env` locally):

```dotenv
DATABASE_URL="<PostgreSQL pooled connection URL>"
DIRECT_URL="<PostgreSQL direct connection URL>"
JWT_SECRET="<existing CareerHub JWT secret>"
OPENROUTER_API_KEY="<OpenRouter key>"
MODEL_NAME="openai/gpt-4o-mini"
INTERVIEW_ML_URL="https://<deployed-ML-service>"
INTERVIEW_ML_TOKEN="" # Public deployment requires no token
INTERVIEW_ML_DISCOVERY_MODE="direct"
INTERVIEW_ML_SESSION_SCOPED="false" # Enable only after verifying deployment isolation
INTERVIEW_ML_TIMEOUT_MS=120000
CLIENT_ORIGIN="http://127.0.0.1:5173,http://localhost:5173,https://careerhub-navy.vercel.app"
```

The supplied Cloud Run URL and existing credentials are configured in the ignored local `.env`. Live temporary-account tests have verified real database persistence, OpenRouter question generation/evaluation, and deployed text/fusion inference. No secrets belong in this document.

For the **bundled ML service**, configure a matching `INTERVIEW_ML_TOKEN`. The existing public Cloud Run service requires no token, as confirmed by the user. Optional `GROQ_API_KEY` enables the reference's Whisper Large-v3-turbo transcription; otherwise the bundled service uses local `WHISPER_MODEL=openai/whisper-tiny.en`. Local fallback needs ffmpeg, model weights/network access on first use, and enough memory. No transcription key belongs in a frontend `VITE_*` variable. The frontend calls CareerHub's API only. LiveKit credentials belong to mentorship meetings and are not required for this interview flow.

The standalone reference frontend URL is useful for visual acceptance but is not a runtime dependency. Model/download URLs are only needed if the deployed ML service requires different weights; inference remains behind its HTTP API.

## Deployed ML contract

All calls originate on the API server. A configured token is sent in `X-Interview-Service-Token`; public direct mode omits it. Direct mode makes inference requests without health or schema probes, per the user’s instruction. Use HTTPS outside localhost. Supported endpoints:

| ML endpoint | Request | Expected output |
| --- | --- | --- |
| `GET /health` | No media | Model readiness booleans |
| `GET /openapi.json` | No media | Available paths and multipart schemas |
| `POST /predict/face` | Multipart `file` image | Emotion/confidence/predictions, or quality-gated `skipped` |
| `POST /predict/voice` | Multipart `file` audio | Emotion/confidence/predictions; nested reference emotion output is normalized |
| `POST /predict/text` | JSON `{text}` | Emotion/confidence/predictions |
| `POST /fusion` | JSON `{face,voice,text}` probability maps | `emotions`, `dominant_emotion`, optional `behavioral_metrics` |
| `POST /transcribe` | Multipart `file` audio | `{success:true,text:"..."}` |
| `POST /proctor/register` | Multipart `file` and **required `session_id`** | `VERIFIED`, `NO_FACE`, or `MULTIPLE_FACES` |
| `POST /proctor/verify` | Multipart `file` and **required `session_id`** | Verification status and optional similarity |
| `DELETE /proctor/session/{session_id}` | No media | Clear ephemeral baseline |

**Deployment compatibility remains to be verified.** The unmodified reference uses a single process-global face baseline and is unsafe for concurrent candidates. Schema-discovery mode requires `session_id` on both proctor endpoints; direct mode requires an explicit `INTERVIEW_ML_SESSION_SCOPED=true` deployment contract. The supplied deployment has not established this isolation, so proctoring remains unavailable. If the existing deployment still has the global contract, environment values alone cannot make its verifier safe: deploy the session-isolated implementation in `services/proctoring/` or apply the equivalent change to that service. Other modalities can still operate independently.

The bundled service includes session isolation, token authentication, bounded uploads/transcription concurrency, Whisper transcription, and idle-baseline expiry. Active face checks refresh the original baseline; 15 minutes of inactivity expires it, and a 30-second cleanup task removes expired cache entries. Multi-worker deployments need sticky routing or a shared ephemeral baseline store because baselines are process-local.

## API and lifecycle

- `POST /api/interview/sessions`: creates an owned `in_progress` session with explicit saved consent.
- `PATCH /api/interview/sessions/:id/consent`: explicitly grants `{camera:true}` and/or `{microphone:true}` for an active owned session. Records server timestamps and preserves the other device's consent. Device-off/mute controls stop capture without revoking the recorded grant. Consent-off controls open an explanation before saving consent or requesting browser access; failed saves can be retried without starting capture.
- `POST /api/interview/sessions/:id/questions`: generates questions once; concurrent requests share work and a serializable transaction rechecks persistence.
- `PUT /api/interview/questions/:id/answer`: saves a nonempty answer and attempts optional text analysis.
- `POST /api/interview/sessions/:id/analysis/:modality`: handles face, voice, text, fusion, transcription, and face registration/verification. Ownership, active status, consent, media size/type, and question ownership are checked.
- `GET /api/interview/capabilities`: exposes readiness booleans without service secrets or URLs.
- `POST /api/interview/sessions/:id/evaluate`: requires at least one real answer, validates feedback for every answered question, persists derived fusion when available, then atomically saves question feedback and completes the session. Invalid/incomplete AI output remains retryable.
- `PATCH /api/interview/sessions/:id` with `{status:"abandoned"}` ends an unanswered session.
- `GET /api/interview/sessions` and `GET /api/interview/sessions/:id`: owned history/details; active sessions resume at the first unanswered question.
- `DELETE /api/interview/sessions/:id`: deletes the owned session and cascaded questions/derived records, and requests ephemeral baseline cleanup.

Optional model failures return unavailable states; they never manufacture emotion, confidence, scores, or identity matches. Reports use only model outputs tagged at the server boundary, and verification labels require server-recorded ML evidence. Older results without provenance are not presented as verified model evidence. Fusion uses saved model predictions, not client-invented distributions. Raw media and biometric embeddings are never stored in Prisma or returned to the browser. Camera/microphone streams stop when disabled, on completion, and on unmount.

## Local verification

Use the repository's supported Node.js runtime (this workspace uses Node 25), Python 3.10+, and installed npm dependencies. The frontend helper test transpiles the actual TypeScript source using the installed compiler and runs outside the browser source tree:

```powershell
npm run test:interview
python -m unittest discover -s services/proctoring -p 'test_*.py'
python -m py_compile services/proctoring/server.py services/proctoring/face_verifier.py services/proctoring/transcription.py services/proctoring/session_cache.py
npm run build:web
```

With the frontend running on localhost:

```powershell
npm run test:interview:browser
```

The browser check uses a separate headless Chrome profile and intercepts **all** `/api` requests. It verifies Quick Mock setup, no device capture without consent, typed completion, retry after evaluation failure, absence of invented report data, mobile report sizing, and device denial. `INTERVIEW_TEST_BROWSER` can override the Chrome executable path and `INTERVIEW_TEST_ORIGIN` can override localhost. API tests use in-memory database/AI boundaries and real local Express HTTP; Python tests cover transcription failover and baseline-cache isolation/expiry without loading neural models.

## Live functional QA — 2026-10-30

Mentor approval and broad functional QA now cover accounts, validation, ownership, resume CRUD/PDF/AI, roadmaps/recommendations, dashboard/PRI, AlgoRank browsing/community/playlists, mentorship scheduling/chat/feedback/notifications, and the real interview lifecycle. The expanded live API pass has 133 passing checks; the legacy all-module runner has 12 passing check groups. Both runs removed their own temporary accounts and records. No code-execution routes were called.

The full TypeScript check passes after fixing the accordion props and bulk-availability callback. The final minified production frontend build passes (two worker threads), alongside 31 live browser scenarios, five provider checks including real two-participant synthetic WebRTC, six isolated browser regressions, 62 Node tests, and seven Python tests. Detailed evidence is in the workspace outputs/careerhub-functional-qa.html report.

Direct text and fusion inference succeeded against the supplied Cloud Run service; cold starts can take around 80 seconds. Voice and transcription endpoints responded to synthetic audio, but those calls do not establish model accuracy. Silence produced a transcription, so audio-quality acceptance remains pending.

Remaining acceptance requires representative real camera/microphone inputs, no-face/multiple-face/mismatch checks, deployed session-isolated identity baselines, and model accuracy assessment. No invented verification is shown when these are unavailable. Browser device-denial and consent paths are tested with isolated fixtures; synthetic WebRTC tests do not prove physical-device audio quality.

Live QA uses the supplied services and production database only for uniquely named temporary test accounts and owned records. No database migrations, unrelated-user changes, pushes, or deployments are performed. AlgoRank code execution remains excluded until the Oracle service is restored.
