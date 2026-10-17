# AI Interview MVP Contract

## Session lifecycle

`setup → consent → in_progress → completed → results`

The user configures interview type, topics, target role, experience level, duration, and optional camera/microphone analysis. Questions are generated and saved to the session before answering. A user can abandon or delete their own session. Results include per-question evaluation, overall written feedback, and derived coaching analysis when available.

Camera and microphone are optional. The browser must obtain explicit consent before requesting either permission. A denied permission or unavailable device disables only that modality; typed answers and the remaining enabled modalities continue. Raw frames and audio are processed in memory and are never persisted. Transcripts, answers, evaluation output, derived emotion results, and proctoring event metadata may be persisted. Experimental competency scores are coaching-only and are excluded from PRI.

## API contract

All endpoints require `Authorization: Bearer <CareerHub JWT>`. Every session, question, analysis, and event read/write is scoped through the authenticated session owner.

| Method and path | Purpose |
| --- | --- |
| `POST /api/interview/sessions` | Create a session from type, topics, role, experience level, duration, and requested modalities |
| `GET /api/interview/sessions` | List the current user's sessions, newest first |
| `GET /api/interview/sessions/:id` | Read a session with ordered questions and saved results |
| `POST /api/interview/sessions/:id/questions` | Generate and persist the configured question set using OpenRouter |
| `PUT /api/interview/questions/:id/answer` | Save the user's transcript/text answer and answer timestamp |
| `POST /api/interview/sessions/:id/evaluate` | Evaluate answered questions, persist question and session feedback, and complete the session |
| `POST /api/interview/sessions/:id/analysis/:modality` | Analyze one face frame, audio clip, or transcript through the secured ML service; modality is `face`, `voice`, `text`, or `fusion` |
| `POST /api/interview/sessions/:id/proctor-events` | Persist a derived proctoring event (no media payload) |
| `DELETE /api/interview/sessions/:id` | Delete an owned session and its dependent records |

Responses use JSON. Session reads return `{ session }`; list returns `{ sessions }`; create/generate/evaluate return the updated `{ session }`; answer and analysis endpoints return the updated question or analysis result. Invalid input returns 400, missing/foreign resources return 404, unauthenticated requests return 401, and unavailable AI/ML services return 503. Uploads are size-limited and accepted only on analysis routes; raw media is forwarded transiently and not logged.

## Persistence mapping

- Keep CareerHub `InterviewSession` as the owner-scoped parent; add generation configuration, modality consent/availability, and lifecycle metadata required by the contract.
- Extend `InterviewQuestion` with type/topic/difficulty, expected answer points and evaluation criteria required by generation and evaluation.
- Add session-scoped emotion analysis records that reference an optional question and store only derived JSON results and modality/timestamps.
- Add session-scoped proctoring event records containing event type, severity, and non-media metadata.
- Keep face-verification embeddings in short-lived, per-session ML service memory only; never store embeddings or raw frames in the database.

Prisma deletion cascades remove questions, derived analysis, and proctoring events with their parent session. Delete the ephemeral verification entry when the session ends, is deleted, or expires.

## ML and scoring behavior

The Express API authenticates the user and owns session checks; it calls FastAPI with a private service credential. FastAPI validates request size and content and returns normalized emotion distributions. Fusion uses the proposal's initial face/voice/text weights (0.45/0.45/0.10), masks unavailable modalities, and renormalizes remaining weights. Empty modality sets produce an unavailable analysis, not fabricated scores.

Emotion names are normalized to `anger`, `disgust`, `fear`, `happiness`, `sadness`, `surprise`, and `neutral`. `joy → happiness`; `happy → happiness`; `angry → anger`. Do not invent `anxiety` or `frustration` model classes. Any derived competency mapping must be explicitly documented and validated before display. Coaching metrics do not affect PRI.

## Frontend state and failure handling

- Setup validates configuration before creating a session.
- Consent is per session and per device type. Declining camera/microphone leaves the typed interview available.
- Session UI shows permission, recording, analysis, save, and error states accessibly; local media is stopped and released on navigation/completion.
- An unavailable AI provider blocks question generation/evaluation with a retryable message; it does not silently substitute unrelated output.
- An unavailable ML service marks that modality as unavailable and allows the interview to proceed with available modalities.
- Results distinguish AI answer feedback from optional experimental affective coaching analysis.
