# CareerHub — Unified Interview Prep Platform
## Product Requirements Document (Draft v1 — for agent validation against actual codebases)

> **Note to coding agent (Devin/OpenHands/etc.):** This PRD was drafted based on a description of four existing codebases (AlgoRank, Resume_Builder, AI Mock Interview Platform, Senior Connect), not a direct read of them. Your first task is to read `legacy/*` and produce a corrected version of this document — flag any assumption below that doesn't match reality, especially in the data model section.

---

## 1. Overview

CareerHub merges four standalone student projects into one placement-preparation platform with a single login, single dashboard, and shared design language:

1. **AlgoRank** — LeetCode-style DSA problem solving, code execution via self-hosted Piston
2. **Resume Builder** — AI-assisted resume creation, multiple templates/versions
3. **AI Mock Interview** — practice interviews with AI feedback, proctoring ML model
4. **Senior Connect** — junior-alumni chat and scheduled meetings. **Codebase already built** — this module is a port, not a from-scratch build. Video calls are handled via an embedded third-party service (Jitsi Meet), not custom WebRTC — CareerHub only handles scheduling and the room link, not the actual stream.

## 2. Goals

- One account, one login, works across all four modules
- One dashboard showing cross-module stats (problems solved, interviews taken, resumes created, connect sessions)
- Consistent UI/UX across modules (shared design system, not four different apps stitched together)
- Two role tiers: `USER` (default) and `ADMIN` (platform-wide), plus an `isAlumniMentor` capability flag for Senior Connect
- Team workflow: one integrator (you) merging feature branches from teammates, starting with the AI Interview module

## 3. Non-goals (for v1)

- Real-time collaborative code editing
- Native mobile app
- Payment/subscription system
- Building in-house video/WebRTC infrastructure — Senior Connect embeds a third-party service (Jitsi Meet) instead
- Production deployment — running on localhost for the 4-week build; deployment is a later decision, not in scope for the demo timeline

## 4. Architecture

```
apps/
  web/              React + Vite + TypeScript, Tailwind + shadcn/ui, Zustand
  api/               Node.js + Express + TypeScript + Prisma
services/
  proctoring/        Python ML service (face/gaze detection), called by api over REST
packages/
  shared/            Shared TS types, auth utils, UI primitives
legacy/              Old repos, reference-only, not deployed
```

- **Database:** Single PostgreSQL instance, Prisma as the only ORM. AlgoRank's existing Prisma+Postgres setup is the base to extend.
- **Auth:** Single custom JWT + bcrypt system (pattern from AlgoRank/Resume Builder). Supabase Auth (currently used by AI Interview) is retired — its schema gets pulled into the shared Prisma schema via `prisma db pull` against a read-only connection to the teammate's Supabase Postgres instance, then rebuilt as native Prisma models.
- **Code execution:** Piston (self-hosted, Oracle Cloud) stays as-is, called from the AlgoRank module.
- **AI integrations:** OpenRouter/OpenAI SDK + Google Generative AI SDK, reused across Resume Builder and AI Interview feedback generation.
- **Video calls (Senior Connect):** Embedded third-party service — Jitsi Meet. CareerHub's backend only creates/stores the meeting room reference and schedule; the actual video/audio stream is entirely handled by the third-party embed, not our infrastructure.
- **Proctoring:** Separate Python microservice, not merged into the Node backend. **Details TBD** — model choice, detection approach, and REST contract with `apps/api` are not yet defined; treat this as a placeholder module until specced.
- **Deployment:** None planned for v1. Runs on localhost (Postgres via local instance or a free dev-tier Neon branch) for the full 4-week build. Deployment target and process to be decided after the localhost version is stable.

## 5. Roles & permissions

```prisma
enum Role {
  USER
  ADMIN
}

model User {
  id             String   @id @default(uuid())
  email          String   @unique
  passwordHash   String
  role           Role     @default(USER)
  isAlumniMentor Boolean  @default(false)
  createdAt      DateTime @default(now())
  // relations: resumes, submissions, interviewSessions, connectSessions
}
```

- `USER`: full access to all four modules as a normal member
- `ADMIN`: platform-wide — create/edit problems, moderate resumes, manage users, view platform-wide analytics
- `isAlumniMentor`: any user can be flagged as an alumni mentor, reachable via Senior Connect, without changing their base role

One auth middleware, one `requireRole()` check per protected route — no per-module admin logins.

## 6. Data model outline (high-level — agent to reconcile with actual schemas)

- `User` (id, email, passwordHash, role, isAlumniMentor, profile fields)
- `Resume` (id, userId, content Json, template, isPublic, version)
- `Problem` (id, title, difficulty, tags, testCases[])
- `Submission` (id, userId, problemId, code, language, status, runtimeMs, memoryKb)
- `Playlist` (id, userId, name, problems[])
- `InterviewSession` (id, userId, mode, status, startedAt, completedAt)
- `InterviewAnswer` (id, sessionId, question, answerText, feedback)
- `ConnectRequest` (id, juniorId, alumniId, status, scheduledAt)

## 7. Unified dashboard

Single endpoint aggregating parallel Prisma queries — no denormalized stats table, computed on read:

```ts
const [problemsCount, interviewsCount, resumesCount, connectCount] = await Promise.all([
  prisma.submission.groupBy({ by: ['problemId'], where: { userId, status: 'ACCEPTED' } }),
  prisma.interviewSession.count({ where: { userId, status: 'COMPLETED' } }),
  prisma.resume.count({ where: { userId } }),
  prisma.connectRequest.count({ where: { OR: [{ juniorId: userId }, { alumniId: userId }], status: 'COMPLETED' } }),
]);
```

## 8. Frontend / design direction

- Tailwind CSS + shadcn/ui component base
- One shared app shell: navbar, sidebar, auth context — wraps all four module routes (`/resume`, `/algorank`, `/interview`, `/connect`)
- Visual reference: CodeHelp, TakeUForward (LoveBabbar's platform) — dark/light dual theme, card-based dashboard, restrained accent color, generous whitespace
- Landing page built separately from the authenticated app shell, single clear CTA

## 9. Team workflow

- Monorepo, npm workspaces
- `main` = stable/demo branch
- Feature branches per module: `feature/interview`, `feature/algorank`, `feature/resume`, `feature/connect`
- Single integrator (you) reviews and merges all PRs
- Shared Prisma schema changes require integrator review before merge to avoid migration conflicts

## 10. Phased plan — 4 weeks, AI-agent-assisted, parallel tracks

Timeline is tight, so modules are built in parallel (agent-assisted) rather than strictly sequential. You act as integrator, reviewing PRs and owning the shared schema.

**Week 1 — Foundation (blocks everything else, do this first, sequentially)**
- Monorepo scaffold (npm workspaces), CI basics
- Pull AlgoRank's existing Prisma schema as the base
- Pull teammate's Supabase schema via `prisma db pull` (read-only connection or he runs it and sends you the file)
- Merge both into one unified `schema.prisma`: User/Auth core + Role enum + isAlumniMentor
- Shared JWT auth middleware + `requireRole()`
- App shell: navbar, sidebar, routing skeleton (empty pages per module for now)
- **Exit criteria:** one login works across empty module routes, schema migrated and deployed to a shared dev Postgres (Neon)

**Week 2 — Parallel module porting (agents run concurrently on branches)**
- `feature/algorank` — port AlgoRank backend+frontend into the new structure, Piston integration intact
- `feature/resume` — port Resume Builder, Mongo→Postgres data layer, JS→TS
- `feature/interview` — teammate's branch, rebuild Supabase logic as native Prisma models, retire Supabase Auth calls
- You: review/merge as branches land, resolve schema conflicts early
- **Exit criteria:** three modules functional independently behind the shared auth, even if UI is rough

**Week 3 — Senior Connect port + dashboard + design pass**
- `feature/connect` — port existing Senior Connect codebase into the new structure (chat, alumni discovery, scheduling logic already built, not new development), swap its auth for the shared JWT system
- Wire up the third-party video embed (Jitsi Meet) for scheduled calls — backend only stores the room reference, no custom streaming logic
- Unified dashboard endpoint + page (parallel aggregate queries across modules)
- Apply shared design system (Tailwind + shadcn) across all module UIs for visual consistency
- Landing page
- **Exit criteria:** all four modules reachable from one shell, dashboard shows real cross-module stats, a scheduled Connect call opens a working video room

**Week 4 — Proctoring (if in scope), testing, polish**
- Proctoring ML service: spec is still TBD — decide by end of Week 2 whether it's built, stubbed convincingly, or presented as a "future work" slide. Do not let it block the rest of the demo.
- Seed data, smoke tests on critical flows (login, submit code, generate resume, complete interview, connect request + video room)
- Run the full app end-to-end on localhost — this is the v1 target, not a deployed environment
- Demo script, README, report writing
- **Exit criteria:** all four modules work end-to-end on localhost, demoable from a single `npm run dev` at the root

**Risk flag:** the proctoring ML model is the most likely thing to slip — it's a separate stack (Python/CV) with no spec yet and no existing integration point. Decide by end of Week 2 whether it's in scope for the 4-week demo or a "future work" slide.

**Deployment (out of scope for this plan):** once localhost is stable, revisit hosting as a separate follow-up decision — not part of the 4-week build.

## 11. Open questions for the agent to resolve against real code

- Exact shape of AI Interview's Supabase schema (pull via introspection, don't guess)
- Whether Resume Builder's image upload (ImageKit) needs any changes post-migration
- Piston's current API contract with AlgoRank's backend (confirm before porting)
- Any auth logic differences between AlgoRank admin and Resume Builder's existing JWT setup that need reconciling
- Confirm how Jitsi is currently integrated in `legacy/senior-connect` (embedded iframe vs. Jitsi API/SDK) — port whatever's already working rather than re-integrating from scratch
- Proctoring ML service: no spec exists yet. Before Week 4, define: what it detects (face presence, gaze, tab-switching, etc.), what model/library, and the REST contract with `apps/api`

## 12. Validation workflow — before Phase 1 starts

This PRD was built without reading the actual codebases, so it's a draft to correct, not a final spec. Before any implementation begins:

1. **Give the agent this PRD + full read access to `legacy/*`.**
2. **Ask it to validate every section against the real code**, not just the data model — architecture assumptions, the Jitsi integration in Senior Connect, AlgoRank's actual Piston contract, and the AI Interview module's real Supabase schema all need checking against source, not description.
3. **Explicitly ask it to flag disagreements, not just confirm.** A prompt like: *"Read this PRD and the four codebases in legacy/. For each section, tell me what's wrong, what's missing, and what you'd do differently — including simpler, faster, or more reliable approaches than what's written here. Don't just validate; push back where you have a better idea."* This matters because an agent that only confirms what it's told isn't adding value over what you already have.
4. **Have it output a corrected PRD plus a detailed, code-grounded execution plan** — concrete file paths, specific migration steps, actual function/route names from the legacy repos — replacing the high-level phase descriptions here with something an agent (or you) can execute directly.
5. **Re-run this check per phase, not just once upfront.** As each module gets ported (Week 2's parallel branches, Week 3's Connect port), have the agent re-validate that phase's slice of the plan against what actually landed — plans drift once real code starts moving, and catching that early is cheaper than catching it in Week 4.

This is the step that turns this document from "a reasonable guess at the architecture" into an actual build plan — treat everything above as the starting hypothesis, not the final word.
