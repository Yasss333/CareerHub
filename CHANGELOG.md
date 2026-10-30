# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Added device preflight and entire-monitor sharing for proctored interviews, browser monitoring with stop/recovery and server continuation leases, a separate candidate introduction, and visual performance analytics.
- Added a dedicated administrator workspace for account activity, mentor approval/removal, interviews, roadmap milestones, feedback and problem management, with database-role enforcement and an audit trail for mentor removal.
- Added Report a bug / suggestion from every signed-in interface, private feedback history, and administrator triage with reporter-visible updates and JSON export. Reports use durable PostgreSQL JSON, bounded input/context, duplicate-safe retries and account-based submission limits.

### Fixed
- Require the current account role in problem-library authorization and remove the manual seed endpoint’s known default/query/JWT-secret bypass. Seed-key access now requires a separate explicitly configured strong header secret.
- Allow candidates to enable camera or microphone during interviews initially started without media consent; controls now request explicit consent and persist it before capture instead of remaining disabled.
- Restored administrator approval for mentor signup/profile applications, hid unapproved mentors from discovery/booking, preserved approved profile edits, and fixed the bulk-availability callback.
- Rejected malformed account/resume/roadmap input, restricted private-roadmap recommendations to their owner, and made API port-binding failures explicit.
- Made availability batches atomic, validated slot dates/times/timezones, used the slot timezone consistently in booking, and prevented concurrent double booking with serializable transactions.
- Prevented delayed initial resume/interview loads from overwriting typed edits, resumed fully answered interviews at their final question, and corrected unchanged-resume dirty detection.
- Updated ImageKit upload authorization to the installed SDK helper API and corrected unsupported accordion props.
- Replaced invented interview emotion scores, identity matches, and report defaults with verified model output and explicit unavailable states. Fixed media-consent handling, hidden submission errors, evaluation retries, and concurrent question generation.
- Replaced the placeholder resume HTML response with an authenticated A4 PDF download, fixed the browser print fallback, and made cover-letter dates selectable with a guaranteed current-date default.
- Fixed false live-call alerts by deriving meeting state from verified LiveKit participants; added 30-minute client inactivity disconnect, five-minute empty-room cleanup, and a 24-hour hard session cap.
- Made AlgoRank optional for Electronics/Electrical and Other Engineering candidates, with specialization-aware PRI weights and a full-scale normalized score.
- Fixed a ranking endpoint runtime error and made the dashboard retain its non-AlgoRank data when ranking, problem, or submission APIs are temporarily unavailable.
- Fixed resume editor dashboard navigation and isolated resume PDF printing to a single-page A4 document; cover-letter PDFs now use a clean print layout without browser-added page headers or footers.
- Fixed landing-page Explore Modules hover contrast with a visible multicolor gradient.
- Enabled mentors to submit student feedback after completed sessions and ensured direct rescheduling sends confirmation notifications to both participants.
- Removed fabricated PRI defaults and sample trend data from dashboard and mentor session summaries. PRI components now use user-specific records, default to zero, reject client-supplied scores, and upsert one server-derived UTC-day snapshot per user.
- Made mentor resume parsing evidence-based, with only current account profile fields used as fallbacks; removed generated title, company, location, experience, biography, and expertise defaults.
- Changed accepted-session rescheduling to require the other participant's approval, leaving the current booking unchanged until approval and rechecking time/conflicts before applying it.
- Clear unread session-message notifications when the conversation opens, preserve pending reschedule requests from bulk dismissal, and show a post-meeting state after leaving or disconnecting from LiveKit.
- Require an active login before resume imports start; retained authenticated API calls for PDF and pasted-text imports.
- Fixed Senior Connect video call launch: defaulted provider to direct instant call in `VideoMeetingModal.tsx` and removed the blocking Docker notice screen from `LiveKitMeetingView.tsx`, enabling one-click seamless video meetings with camera/microphone access without intermediary prompts.
- Fixed broken learning links button on roadmap stage cards in `RoadmapDetail.tsx` by turning it into an interactive modal with categorized resources (documentation, courses, practice, videos) and direct links
- Removed legacy resume test feature from `ResumeBuilder.tsx` as requested, focusing the workspace on content editing and live preview

### Added
- Integrated Quick Mock presets, server transcription with optional Groq/local Whisper, persisted multimodal fusion, and session-isolated proctoring contracts from the `ai-mock-interview-platform-2` reference. Added isolated API, browser, and transcription regression checks; deployed-service acceptance remains pending environment configuration.
- Added optional candidate specialization selection at registration and persisted it through a nullable `User.specialization` enum field; existing accounts remain compatible and retain their current AlgoRank visibility.
- Added a shared UTC-day activity streak across resume creation/import/duplication, roadmap creation and milestone progress, accepted AlgoRank solves, completed interviews, and completed mentorship sessions; the displayed streak expires after a day without activity.
- Automated database seeding for deployed AlgoRank:
  - Added programmatic `seedDatabase(client)` export in `apps/api/prisma/seed.js` creating 500+ curated and categorized DSA problems, demo admin (`admin@algorank.com`), and recruiter accounts.
  - Added self-healing database auto-seeding check in `apps/api/src/index.js` on API startup when `problem.count() === 0`.
  - Added manual seed endpoint `POST /api/algorank/seed` protected by admin authorization or `x-seed-key` header.
  - Updated Render build command in `render.yaml` and added `"seed:api"` command in root `package.json`.
- Added real-time mentor meeting start alerts and direct "Start Meet" notification flows:
  - Added in-app notification dispatch in `POST /api/connect/sessions/:id/start` notifying candidates when mentors launch a video session.
  - Added real-time silent session polling (every 4s) and Web Audio API soft chime in `SeniorConnectSessions.tsx`.
  - Added pulsing "Live Meeting Started" alert banner with direct "Start Meet / Join Now" button at top of sessions page.
  - Added interactive session card live state highlighting (`ring-2 ring-emerald-500`) and glowing "Start Meet / Join Now" button when a call is started.
  - Added global top banner alert across all authenticated views in `Layout.tsx` for real-time live meeting notification with one-click direct launch.
  - Added `session_started` notification type with direct action button in `NotificationsPanel.tsx`.
- Implemented in-house WebRTC SFU video conferencing using self-hosted LiveKit:
  - Added isolated branch `feat/livekit-video-conferencing` for testing and gradual verification.
  - Added `livekit-server-sdk` in `apps/api` and `livekit-client`, `@livekit/components-react`, `@livekit/components-styles` in `apps/web`.
  - Added token generation service (`livekit.service.js`) and endpoint `GET /api/connect/sessions/:id/livekit-token` with session participant validation and role-based permissions.
  - Added in-house Docker service definition for LiveKit server (`livekit/livekit-server:latest`) to `docker-compose.yml` and `docker-compose.prod.yml` running on port 7880.
  - Created `LiveKitMeetingView.tsx` with adaptive bitrate, screen sharing, speaker view, and participant tiles.
  - Enhanced `VideoMeetingModal.tsx` with a dual-engine toggle allowing seamless switching between in-house LiveKit and public Jitsi Meet, with automatic fail-safe fallback.
- Created complete production deployment guide (`DEPLOYMENT_GUIDE.md`) and updated `docs/deployment.md`:
  - Step-by-step instructions for Hugging Face Spaces Docker deployment for the AI multimodal proctoring service (16 GB free RAM tier).
  - Neon PostgreSQL serverless database setup instructions with pooled connection string and Prisma direct URL configuration.
  - Render API blueprint deployment guide with full environment variable reference and `/health/ready` check.
  - Vercel frontend deployment with edge rewrites proxying `/api/*` requests to Render.
  - Production Dockerfiles for backend API (`apps/api/Dockerfile`) and React web frontend with Nginx (`apps/web/Dockerfile`, `apps/web/nginx.conf`).
  - Full-stack production orchestration configuration (`docker-compose.prod.yml`).
  - 1-Click Hugging Face Space deployment scripts for PowerShell (`scripts/deploy-hf-space.ps1`) and Bash (`scripts/deploy-hf-space.sh`).
  - Root `.dockerignore` and ML service `.dockerignore` to streamline container builds.
- Streamlined Senior Connect mentor onboarding and session management (Topmate-style flow):
  - Added dedicated Candidate vs Senior/Mentor role selection to the Sign-Up page (`Register.tsx`) with automatic mentor profile initialization and instant routing to `/mentor/profile`.
  - Added AI senior resume parser endpoint `POST /api/connect/parse-senior-resume` and frontend upload interface in `SeniorConnectProfile.tsx` supporting PDF and text auto-fill for title, company, domain, role, experience, location, bio, and skills.
  - Eliminated admin approval bottleneck for mentor profiles and meetings; mentors are auto-approved on profile creation and directly accept/decline candidate requests.
  - Added student Placement Readiness Index (PRI) inspection card on session requests, giving mentors instant visibility into candidate mock interview scores, AlgoRank accuracy, and resume quality.
  - Added in-page encrypted video conferencing modal (`VideoMeetingModal.tsx`) with Jitsi Meet embedding, fullscreen mode, and new tab launcher.
  - Added interactive session chat (`SessionChatModal.tsx`) backed by `GET/POST /api/connect/sessions/:id/messages` and `SessionMessage` Prisma model with real-time polling.
  - Added 1-click slot presets ("Today 6-7 PM", "Tomorrow 6-7 PM", "Weekend 11 AM-12 PM") and simple slot management.
  - Enforced focused mentor-only layout hiding candidate tools (Resume Builder, AlgoRank, Roadmaps) for `MENTOR` accounts.
- Overhauled Resume Builder UI semantics matching reference design:
  - Added dedicated dashed action cards for "Create Resume" and "Upload Existing" on `ResumeList.tsx`
  - Added profile category filter dropdown and public resumes discovery section with distinct color-bordered cards
  - Added AI resume upload & parser supporting PDF, TXT, DOCX, and pasted text via `pdfToText` and OpenRouter AI
  - Redesigned `ResumeBuilder.tsx` with header action pills (Private/Public, ATS Score, Cover Letter, Download), top progress indicator line, template dropdown selector (classic, modern, minimal-image, minimal), 10-color accent palette, step forms with AI enhancement, and sticky A4 live document preview
- Integrated real AI Mock Interview results directly into Dashboard Placement Readiness Index (PRI):
  - Added `GET /api/dashboard/pri/live` calculating 45% interview weight directly from candidate's completed AI mock interview scores
  - Dynamically displays completed interview sessions count and live score breakdown in Dashboard readiness widget
- Fixed unhandled empty question state in `InterviewSession.tsx` by auto-triggering AI question generation on session mount with interactive retry UI
- Fixed `TypeError: Cannot read properties of undefined (reading 'length')` in interview question generation route by eager loading session questions in `requireOwned`
- Fixed module hoisting issue in `roadmap-ai.js` and `config/ai.js` where `OPENROUTER_API_KEY` was captured before `.env` was loaded
- Fixed premature interruption and auto-stopping during question speech by eliminating microphone self-interruption echo, adding hardware echo cancellation, human vocal bandpass filter, 2.5s initial grace period, and synthesis keep-alive
- Fixed Prisma `hasSome` validation error in `recommendation.service.js` by filtering topics to strings only

### Added
- Real-time AudioContext Voice Activity Detection (VAD) and speech recognition barge-in interruption allowing candidate to interrupt the AI interviewer at any point by speaking or clicking
- Dynamic neural voice selection with live voice switcher dropdown and asynchronous voice loader
- Human-like conversational question framing ("Welcome to your interview...", "Thank you for your answer...")
- Multi-bar reactive voice equalizer in `AIInterviewerAvatar.tsx` mimicking Vapi/Siri waveform dynamics
- Dedicated Multimodal Affect & Emotion Coaching Dashboard in `InterviewResults.tsx` displaying Facial Affect, Vocal Tone, Answer Sentiment, and Proctoring verification metrics
- Resilient ML service fallback and emotion persistence in `interview.routes.js` ensuring facial, voice, and text emotions are always saved and visualized
- Interactive two-way video call interface for AI Mock Interview (`InterviewSession.tsx` and `AIInterviewerAvatar.tsx`):
  - Concentric animated pulsing AI avatar with dynamic state transitions (`speaking`, `listening`, `idle`)
  - Browser Text-to-Speech (TTS) reading questions aloud automatically with replay audio capability
  - Continuous hands-free Speech-to-Text (STT) transcribing answers in real time into live captions
  - Dual-grid video conferencing room layout (Candidate live webcam feed with identity verification + AI Interviewer)
  - Bottom video call control dock with microphone mute, camera toggle, question replay, answer editor drawer, and call completion controls
  - Real-time facial and voice emotion coaching feedback HUD
- Configured production-ready Hugging Face Spaces and Docker deployment for AI Interview ML service (`services/proctoring`)
- Migrated ML models to auto-downloading Hugging Face pretrained models (`trpakov/vit-face-expression`, `j-hartmann/emotion-english-distilroberta-base`, `ehcalabres/wav2vec2`) with 7-class emotion normalization
- Added shared `INTERVIEW_ML_TOKEN` authentication and `INTERVIEW_ML_URL` proxy configuration between Express API and FastAPI ML service
- Added Dockerfile with CPU-optimized PyTorch and Hugging Face non-root user 1000 configuration
- Added proctoring service definition to `docker-compose.yml` for unified local container execution
- Achievement and badge system with 25+ unlockable achievements across all modules
- Achievement tracking for AlgoRank (first solve, streaks, problem counts, leaderboard)
- Achievement tracking for Resume Builder (created, published, AI-enhanced)
- Achievement tracking for Senior Connect (sessions completed, mentor approval, ratings)
- Achievement tracking for AI Interview (completed, perfect score, multiple interviews)
- Achievement tracking for Roadmap Generator (created, milestones, completion)
- Achievements badge component with modal view and progress tracking
- Cross-module recommendation engine (recommendation.service.js)
- Problem recommendations based on roadmap topics and skills
- Resume skill suggestions derived from learning roadmaps
- Mentor recommendations matching user's learning goals
- Learning path suggestions based on user activity and strengths
- Cross-module insights for dashboard combining stats from all modules
- AI Interview module with complete migration from Supabase to CareerHub (all phases complete)
- AI Interview database schema extension with EmotionResult and ProctoringEvent models
- AI Interview Express API routes with OpenRouter integration for question generation and evaluation
- AI Interview ML service proxy with secure authentication (INTERVIEW_ML_TOKEN)
- AI Interview frontend pages: Interview, InterviewSetup, InterviewSession, InterviewResults
- AI Interview camera capture and audio recording components with WebRTC integration
- AI Interview real-time emotion display and face verification UI
- AI Interview privacy-compliant implementation (raw media not persisted, only derived results)
- AI Interview face verification with per-session ephemeral state in ML service memory
- AI Interview graceful modality fallback when camera/microphone unavailable
- Added Electronics Engineer and Robotics Engineer roadmap templates, plus AI-generated custom roadmaps from a learner's field and goals using the server-configured OpenRouter key
- Made Resume Builder AI enhancement context-aware for work experience and projects, with a two-bullet, fact-grounded output limit
- Unified resume and roadmap AI calls on the verified OpenRouter model ID, corrected the local model setting, and added a local `DIRECT_URL` matching the Docker database URL
- Added accessible loading, recoverable error and retry states across AlgoRank, Roadmaps, and Senior Connect, with consistent page framing on core screens
- Added unsaved-work warnings for resume editing, roadmap setup, mentor profiles, and coding solutions
- Added Vercel and Render deployment configuration, Neon pooled/direct database URLs, production health checks, and deployment documentation
- Added a collapsible dashboard sidebar and account settings for name, email, and profile photo updates
- Integrated a CareerHub product landing page as the public home page with working sign-in and registration links
- Removed school, department, and final-year project branding from the landing page
- Expanded the landing page PRI methodology with component definitions, modality handling, example calculation, and validation caveats
- Refreshed the signed-in dashboard with a prominent PRI readiness card, PRI trend, and roadmap shortcut
- Added daily authenticated PRI snapshot persistence and a screenshot-inspired dashboard layout with a labeled sample trend, four student KPIs, and score entry
- Roadmap learning map with selectable connected stages, progress tracking, curated free resources, and searchable career path setup
- Added beginner, intermediate, and advanced roadmap practice paths, free YouTube search links without an API key, and standardized app accents on the shared purple theme
- Dashboard widget customization with persisted hide/show preferences and a restore-defaults action
- Guided six-step Resume Builder with save-and-continue navigation, live desktop preview, and mobile editor/preview tabs
- Administrator review queue for mentor applications, with explicit approve/reject decisions
- Initial project setup with monorepo structure using npm workspaces
- PostgreSQL database with Docker container
- Unified JWT authentication system with bcrypt password hashing
- Resume Builder module with full CRUD operations and advanced features
- Senior Connect module with mentorship features and Jitsi integration
- Shared design system with Tailwind CSS
- React 18 + TypeScript frontend with Vite
- Comprehensive documentation system with agent instructions
- Feature-specific agent files for all modules (Resume Builder, Senior Connect, AlgoRank, AI Interview)
- Progress tracking TODO files for each module
- Architecture documentation including API design and database schema
- Root AGENTS.md with project-level AI agent control guidelines
- Keep a Changelog format for project change tracking
- Advanced Resume Builder form components (ExperienceForm, EducationForm, ProjectForm, SkillsForm)
- Professional summary form with AI enhancement
- ATS analysis modal with scoring and keyword matching
- Cover letter generation modal with PDF export
- Mock interview practice modal with question generation and answer evaluation
- All 4 resume templates (Modern, Classic, Minimal, MinimalImage) in TypeScript
- ImageKit integration for profile image uploads
- AI content generation for professional summaries and job descriptions
- PDF export functionality with print-to-PDF
- Senior Connect Phase 2: comprehensive mentor profile editing interface
- Senior Connect mentor expertise/achievements tag management
- Senior Connect availability slot management UI with conflict detection
- Senior Connect session booking with availability slot selection and conflict detection (junior + senior)
- Senior Connect session status workflow (pending → accepted/rejected/cancelled → started → completed)
- Senior Connect feedback collection with star rating, comment, and tags
- Senior Connect mentor search/filtering (search, domain, expertise)
- Senior Connect availabilitySlotId linking (slot marked booked on booking, freed on cancel/reject)
- AlgoRank backend foundation: problem management API with pagination, difficulty/tag filtering and search
- AlgoRank Piston code execution integration (dry-run execute endpoint and language map ported from legacy)
- AlgoRank submission grading against stored testcases with per-testcase results and submission history
- AlgoRank playlist management (create, list, add/remove problems)
- AlgoRank community features (comments, nested replies, like/unlike)
- AlgoRank leaderboard and ranking endpoints (global leaderboard, user rank, detailed stats, streak recalculation)
- AlgoRank frontend: problem list page with difficulty/tag filters, search and pagination (AlgoRank.tsx)
- AlgoRank frontend: problem detail page with examples, constraints, hints, editorial, likes and discussion (ProblemDetail.tsx)
- AlgoRank frontend: solve page with language tabs, code editor, run/submit and per-testcase results (ProblemEditor.tsx)
- AlgoRank frontend: submission history page (Submissions.tsx)
- AlgoRank Monaco Editor integration with advanced features (syntax highlighting, code templates, keyboard shortcuts, auto-formatting, code completion)
- AlgoRank admin problem creation UI with comprehensive form (title, description, difficulty, tags, examples, constraints, hints, editorial, test cases, code snippets)
- AlgoRank playlist management pages (Playlists.tsx, PlaylistDetail.tsx) with create/list/detail/add-remove functionality
- AlgoRank Piston execution caching with 5-minute TTL for improved performance
- Senior Connect session rescheduling functionality with conflict detection and notifications
- Senior Connect availability bulk editing with recurring pattern generation (weekly, 4 weeks)
- Senior Connect session notes and preparation materials editing for both mentors and mentees
- Cross-module dashboard integration with unified stats from Resume Builder, AlgoRank, and Senior Connect
- Dashboard widgets: resume count/completion, problems solved/rank, mentorship sessions/completed, upcoming sessions
- Dashboard activity feeds: recent sessions, recent submissions, recent resumes
- Roadmap Generator module with hybrid AI-powered learning paths
- Roadmap database models (Roadmap, RoadmapMilestone) with progress tracking
- Predefined career role templates (Frontend, Backend, Full Stack, DevOps, Data Scientist)
- Roadmap API with full CRUD operations and milestone management
- AI-powered roadmap personalization based on skill level and user goals
- AI-generated free learning resources (GFG, YouTube, blogs, documentation, practice platforms)
- Roadmap frontend pages (RoadmapList, RoadmapBuilder, RoadmapDetail)
- ResourceCard component for displaying learning resources
- Milestone tracking with completion status and progress calculation
- Roadmap navigation integration with Map icon
- Dashboard performance metrics: acceptance rate, current streak, ranking score
- Shared AlgoRank frontend helpers (lib/api.ts token-bearing fetch, components/ProblemBadges.tsx)
- AlgoRank problem data set seeded: apps/api/prisma/seed.js ported from legacy (500 problems: 47 curated + 453 auto-generated; 56 tags) with idempotent demo accounts admin@algorank.com/admin123 (ADMIN) and recruiter@algorank.com/recruiter123, 3 demo solved problems + flagged sample; wired via prisma:seed script + prisma.seed config (re-running resets demo password/role and skips existing problems)
- Verified full live Piston grading flow end-to-end (22/22 checks: admin problem create, execute dry-run, correct JS Accepted with per-testcase Testcases rows, wrong JS Wrong Answer, correct PYTHON Accepted, ranking stats + leaderboard updates, problem deletion)
- LANDING_PAGE_SPEC.md: paste-ready landing page build spec for external generators (Google AI Studio/Replit/bolt.ai) with exact palette, section copy, tags/classes, configs, and merge steps
- Senior Connect session calendar view with month navigation and session indicators (react-calendar integration)
- Senior Connect timezone support for availability slots (timezone field added to User and AvailabilitySlot models)
- Senior Connect notification system for session lifecycle events (request, accepted, rejected)
- Senior Connect session history and analytics dashboard with metrics, trends, and status breakdowns
- Senior Connect notifications panel in global layout with unread count indicator
- Senior Connect SessionAnalytics component with overview stats, metrics, monthly trends, and recent sessions

### Changed
- Fixed mock interview question generation to use a consistent JSON contract and added inline generation/evaluation errors
- Normalized common OpenRouter question response shapes and restarted the local API with the updated handler
- Removed the arbitrary 12,000-character cap from Resume Builder AI enhancement inputs
- Added route-level lazy loading, reducing the main production JavaScript entry from about 760 kB to 277 kB; made legacy brand colors and fixed neutral surfaces adapt to the shared purple/dark theme
- Added an ESLint 10 flat config and inline Resume Builder save feedback
- Standardized the signed-in shell and active module brand accents on shared purple theme tokens; refreshed Resume Builder navigation, responsive forms, preview surfaces, and resume list feedback
- Fixed roadmap builder submission to send a valid JSON payload to the API
- Mentor profiles remain private until approved; approved status is required for discovery, availability management, and mentor session actions
- Added a dedicated MENTOR account role, role-selected login, and Senior Connect-only interface and API access
- Resume AI enhancement now uses the Vite same-origin API proxy, a consistent model fallback, input validation, and safe actionable provider-configuration errors
- Refreshed the CareerHub dashboard with theme-aware metric cards, data-driven progress charts, and activity panels; made shared navigation responsive on small screens
- Resume Builder editor and live preview now sit side by side at medium and wider screen sizes
- Extend Senior Connect SessionBooking model with optional availabilitySlotId (Prisma migration required)
- Enhanced Senior Connect booking to accept either User id or SeniorProfile id
- Ported AlgoRank backend from legacy into unified API (apps/api/src/routes/algorank.routes.js)
- Added Piston integration library at apps/api/src/libs/piston.js with timeout and error handling
- Added axios dependency to apps/api for the Piston API client
- Added react-calendar and date-fns dependencies to apps/web for calendar functionality
- Made AlgoRank seed idempotent for demo accounts (update passwordHash + role on re-run)
- Wired AlgoRank frontend routes in apps/web/src/App.tsx (/algorank, /algorank/problems/:id, /algorank/problems/:id/solve, /algorank/submissions)
- Added timezone field to User model (default: UTC) and AvailabilitySlot model for timezone-aware scheduling
- Added Notification model for session lifecycle notifications with user relation and read status
- Applied Prisma migrations: add_timezone_support, add_notifications

### Changed
- Migrated Resume Builder from MongoDB to PostgreSQL + Prisma (backend and frontend complete with all advanced features)
- Migrated Senior Connect from MongoDB to PostgreSQL + Prisma (backend API complete, frontend basic)
- Updated all frontends to React 18 + TypeScript
- Replaced legacy authentication systems with custom JWT authentication
- Unified user model with role-based access control (ADMIN/USER + isAlumniMentor)
- Implemented ImageKit integration for resume image uploads
- Added comprehensive AI features to Resume Builder (ATS analysis, cover letter generation, interview prep)

### Deprecated
- Legacy Supabase authentication (replaced with custom JWT)
- Legacy MongoDB databases (replaced with PostgreSQL)

### Removed
- Legacy MongoDB database files
- Legacy Supabase Auth dependencies

### Fixed
- Database connection issues with PostgreSQL Docker setup
- JWT token validation middleware
- Auth middleware token expiration handling
- Prisma SQLite to PostgreSQL migration
- Senior Connect booking passed SeniorProfile id where User id was expected (resolved via profile lookup)
- Senior Connect feedback endpoint now rejects duplicate feedback and recomputes senior rating from all reviews
- Resolved duplicate React instances that caused an invalid hook call in the web app
- Roadmap and milestone creation now supplies required resource arrays
- Senior Connect mentor authorization now checks the current database flag instead of a stale JWT claim
- AlgoRank leaderboard now consumes the flat API response shape and loads the current user's rank
- Fixed frontend TypeScript errors in resume templates, auth forms, the code editor, session calendar, and mobile sidebar

### Security
- Added JWT secret management with environment variables
- Implemented role-based access control (ADMIN/USER + isAlumniMentor)
- Added password hashing with bcrypt (10 salt rounds)
- Implemented protected routes for sensitive operations

### Documentation
- Created comprehensive documentation system for AI agent control
- Added root AGENTS.md with project-level instructions and decision framework
- Created feature-specific agent files for Resume Builder, Senior Connect, AlgoRank, and AI Interview
- Added progress tracking TODO files for each module with implementation phases
- Created architecture documentation including API design and database schema
- Established documentation conventions to prevent autonomous architectural decisions
- Added module boundaries and integration points documentation

## [0.1.0] - 2024-09-15

### Added
- Initial CareerHub platform foundation
- Resume Builder module with basic CRUD operations (backend complete, frontend basic)
- Senior Connect module with Jitsi video integration (backend complete, frontend basic)
- PostgreSQL database with Docker
- Unified authentication system with JWT
- Shared app shell and navigation

### Known Limitations
- Resume Builder ImageKit integration requires API keys in environment variables
- Resume Builder AI features require OpenRouter API key in environment variables
- AI Interview module requires OpenRouter API key for question generation and INTERVIEW_ML_TOKEN for ML service authentication
- AI Interview ML service (FastAPI) must be running on localhost:8000 for multimodal emotion analysis
- AI Interview behavioral metrics (eye contact, speaking patterns) are experimental and not yet implemented
- Database switched from SQLite to PostgreSQL during development

### Legacy Code Availability
- Resume Builder: Complete functional code with ImageKit, AI generation, PDF export, templates
- Senior Connect: Complete functional code with advanced availability, calendar, notifications
- AlgoRank: Complete functional code with Piston integration, code editor, problem set
- AI Interview: Functional code but requires complex migration (Supabase → CareerHub)

### Implementation Priorities
1. ~~Resume Builder~~ (COMPLETED - all advanced features migrated from legacy)
2. ~~Senior Connect~~ (COMPLETED - full migration from legacy with advanced features)
3. ~~AlgoRank~~ (COMPLETED - full migration from legacy with Piston integration)
4. ~~Landing Page~~ (COMPLETED - integrated with public home page)
5. ~~Dashboard~~ (COMPLETED - unified stats from all modules)
6. ~~AI Interview~~ (COMPLETED - full migration from Supabase to CareerHub with ML service integration)
