# CareerHub — Unified Interview Prep Platform
## Product Requirements Document (Corrected v2 — Based on Actual Codebase Analysis)

> **Validation Status**: This PRD has been corrected based on actual analysis of the four legacy codebases (AlgoRank, Resume_Builder, AI Mock Interview Platform, Senior Connect). All assumptions have been validated against real implementations.

---

## 1. Overview

CareerHub merges four standalone student projects into one placement-preparation platform with a single login, single dashboard, and shared design language:

1. **AlgoRank** — LeetCode-style DSA problem solving, code execution via self-hosted Piston
2. **Resume Builder** — AI-assisted resume creation, multiple templates/versions
3. **AI Mock Interview** — practice interviews with AI feedback, proctoring ML model
4. **Senior Connect** — junior-alumni chat and scheduled meetings with embedded Jitsi Meet video calls

## 2. Goals

- One account, one login, works across all four modules
- One dashboard showing cross-module stats (problems solved, interviews taken, resumes created, connect sessions)
- Consistent UI/UX across modules (shared design system, not four different apps stitched together)
- Unified role system: `ADMIN`/`USER` + `isAlumniMentor` flag for Senior Connect functionality
- Team workflow: one integrator merging feature branches from teammates

## 3. Non-goals (for v1)

- Real-time collaborative code editing
- Native mobile app
- Payment/subscription system
- Building in-house video/WebRTC infrastructure — Senior Connect embeds Jitsi Meet public servers
- Production deployment — running on localhost for the 4-week build

## 4. Architecture

```
apps/
  web/              React 18 + Vite + TypeScript, Tailwind 3 + shadcn/ui, Zustand
  api/               Node.js + Express + TypeScript + Prisma
services/
  proctoring/        Python ML service (face/gaze detection), called by api over REST
packages/
  shared/            Shared TS types, auth utils, UI primitives
legacy/              Old repos, reference-only, not deployed
```

### Technology Stack Reality

**Database:** Single PostgreSQL instance, Prisma as the only ORM
- AlgoRank: PostgreSQL + Prisma ✅ (no migration needed)
- Resume Builder: MongoDB + Mongoose → **Requires migration to PostgreSQL + Prisma**
- AI Interview: Supabase (PostgreSQL) + Supabase Auth → **Friend converting to Prisma + Express backend**
- Senior Connect: MongoDB + Mongoose → **Requires migration to PostgreSQL + Prisma**

**Auth:** Single custom JWT + bcrypt system
- AlgoRank: Custom JWT + bcrypt ✅ (use as base)
- Resume Builder: Custom JWT + bcrypt ✅ (compatible)
- AI Interview: Supabase Auth → **Friend will convert to JWT**
- Senior Connect: Custom JWT + bcrypt ✅ (compatible)

**Frontend:** React 18 + Vite + TypeScript + Tailwind 3 + shadcn/ui + Zustand
- AlgoRank: React 19 → **Downgrade to React 18**
- AI Interview: React 18 ✅ (no change)
- Resume Builder: **Migrate to React 18**
- Senior Connect: **Migrate to React 18**

**Code Execution:** Piston (self-hosted, Oracle Cloud) stays as-is, called from the AlgoRank module
- URL: `http://localhost:2000/api/v2/execute`
- Languages: Python 3.12.0, JavaScript 20.11.1, CPP 10.2.0, Java 15.0.2

**AI integrations:** OpenRouter/OpenAI SDK + Google Generative AI SDK, reused across Resume Builder and AI Interview

**Video calls (Senior Connect):** Embedded Jitsi Meet public servers
- URL generation: `https://meet.jit.si/seniorconnect-session-{bookingId}`
- No API keys or infrastructure setup required

**Proctoring:** Separate Python microservice, not merged into the Node backend
- **Details TBD** — model choice, detection approach, and REST contract with `apps/api` are not yet defined

**Deployment:** None planned for v1. Runs on localhost (Postgres via local instance or Neon dev tier)

## 5. Roles & permissions

### Unified Role System

```prisma
enum Role {
  ADMIN
  USER
}

model User {
  id             String   @id @default(uuid())
  email          String   @unique
  passwordHash   String
  role           Role     @default(USER)
  isAlumniMentor Boolean  @default(false)
  // ... additional fields
}
```

**Role Design:**
- `ADMIN`: platform-wide — create/edit problems, moderate resumes, manage users, view platform-wide analytics
- `USER`: full access to all four modules as a normal member
- `isAlumniMentor`: any user can be flagged as an alumni mentor, reachable via Senior Connect
  - `isAlumniMentor: true` = senior/mentor in Senior Connect context
  - `isAlumniMentor: false` = junior/student in Senior Connect context

**Permission Strategy:**
- One auth middleware, one `requireRole()` check per protected route
- Senior Connect junior/senior functionality controlled via `isAlumniMentor` flag
- No per-module admin logins

## 6. Data model (Corrected based on actual schemas)

### Unified User Model

```prisma
enum Role {
  ADMIN
  USER
}

model User {
  id             String   @id @default(uuid())
  email          String   @unique
  passwordHash   String
  role           Role     @default(USER)
  isAlumniMentor Boolean  @default(false)
  
  // Profile fields (merged from all systems)
  name           String?
  image          String?
  
  // AlgoRank ranking fields
  totalProblemsSolved Int      @default(0)
  acceptanceRate      Float    @default(0)
  averageSolveTime    Float?
  currentStreak       Int      @default(0)
  longestStreak       Int      @default(0)
  lastSolvedDate      DateTime?
  rankingScore        Float    @default(0)
  
  // Senior Connect fields
  avatar         String?
  university     String?
  year           String?
  interests      String[]
  goals          Json[]
  title          String?
  company        String?
  location       String?
  credibilityScore Int     @default(0)
  badges         String[]
  
  // AI Interview profile fields
  displayName    String?
  defaultRole    String?
  defaultInterviewLength Int @default(30)
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  // Relations
  resumes        Resume[]
  submissions    Submission[]
  interviewSessions InterviewSession[]
  seniorProfile  SeniorProfile?
  sessionBookingsAsJunior SessionBooking[] @relation("JuniorBookings")
  sessionBookingsAsSenior SessionBooking[] @relation("SeniorBookings")
  
  @@index([totalProblemsSolved])
  @@index([rankingScore])
  @@index([lastSolvedDate])
}
```

### Resume Builder Models (MongoDB → Prisma)

```prisma
model Resume {
  id          String   @id @default(uuid())
  userId      String
  title       String   @default("Untitled-resume")
  public      Boolean  @default(false)
  template    String   @default("classic")
  accentColor String   @default("#3B82F6")
  professionSummary String @default("")
  skills      String[]
  personalInfo Json
  experience  Json[]
  projects    Json[]
  education   Json[]
  profile     String   @default("")
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### AlgoRank Models (PostgreSQL + Prisma - No Changes)

```prisma
enum Difficulty {
  EASY
  MEDIUM
  HARD
}

model Problem {
  id           String     @id @default(uuid())
  title        String
  description  String
  difficulty   Difficulty
  tags         String[]
  userID       String
  examples     Json
  constraints  String
  hints        String?
  editorial    String?
  testcases    Json
  codeSnippets  Json?
  refrenceSolutions Json?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user     User            @relation(fields: [userID], references: [id], onDelete: Cascade)
  submissions Submission[]
  solvedBy problemSolved[]
  problemInplaylist problemsInPlaylist[]
  likes Likes[]
  comments Comments[]
}

model Submission {
  id            String   @id @default(uuid())
  userID        String
  problemID     String
  sourceCode    String
  language      String
  stdin         String?
  stdout        String?
  stderr        String?
  compileOutput String?
  status        String
  memory        String?
  time          String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user    User    @relation(fields: [userID], references: [id], onDelete: Cascade)
  problem Problem @relation(fields: [problemID], references: [id])
  testcases Testcases[]
}

// Additional AlgoRank models: Testcases, problemSolved, playlist, problemsInPlaylist, Likes, Comments, NestedComments
```

### Senior Connect Models (MongoDB → Prisma)

```prisma
model SeniorProfile {
  id          String   @id @default(uuid())
  userId      String   @unique
  title       String
  company     String
  domain      String
  role        String
  bio         String
  experience  Int      @default(0)
  location    String
  expertise   String[]
  achievements String[]
  rating      Float    @default(0)
  reviewCount Int      @default(0)
  sessionCount Int     @default(0)
  availability String   @default("available")
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model SessionBooking {
  id          String   @id @default(uuid())
  juniorId    String
  seniorId    String
  scheduledTime DateTime
  duration    Int      @default(45)
  topic       String
  notes       String   @default("")
  status      String   @default("pending")
  jitsiRoomName String @default("")
  jitsiRoomUrl  String @default("")
  feedback    Json?
  
  junior      User     @relation("JuniorBookings", fields: [juniorId], references: [id])
  senior      User     @relation("SeniorBookings", fields: [seniorId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([juniorId, createdAt])
  @@index([seniorId, createdAt])
}

// Additional Senior Connect models: AvailabilitySlot, SessionFeedback, CredibilityScore
```

### AI Interview Models (Supabase → Prisma - Friend Handling)

```prisma
model InterviewSession {
  id          String   @id @default(uuid())
  userId      String
  type        String   @default("custom")
  topics      String[]
  role        String?
  experienceLevel String?
  plannedDuration Int @default(30)
  cameraEnabled Boolean @default(false)
  status      String   @default("in_progress")
  startedAt   DateTime @default(now())
  endedAt     DateTime?
  durationSeconds Int?
  feedback    Json?
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  questions   InterviewQuestion[]
  createdAt   DateTime @default(now())
  
  @@index([userId])
  @@index([createdAt])
}

model InterviewQuestion {
  id          String   @id @default(uuid())
  sessionId   String
  questionText String
  questionIndex Int
  category    String?
  answerText  String?
  answeredAt  DateTime?
  questionFeedback Json?
  
  session     InterviewSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  
  @@index([sessionId])
  @@index([questionIndex])
}
```

## 7. Unified dashboard

Single endpoint aggregating parallel Prisma queries — no denormalized stats table, computed on read:

```ts
const [problemsCount, interviewsCount, resumesCount, connectCount] = await Promise.all([
  prisma.problemSolved.count({ where: { userId } }),
  prisma.interviewSession.count({ where: { userId, status: 'completed' } }),
  prisma.resume.count({ where: { userId } }),
  prisma.sessionBooking.count({ where: { 
    OR: [{ juniorId: userId }, { seniorId: userId }], 
    status: 'completed' 
  } }),
]);
```

## 8. Frontend / design direction

- **Tech Stack**: React 18 + Vite + TypeScript + Tailwind 3 + shadcn/ui + Zustand
- One shared app shell: navbar, sidebar, auth context — wraps all four module routes
- Visual reference: CodeHelp, TakeUForward (LoveBabbar's platform) — dark/light dual theme, card-based dashboard, restrained accent color, generous whitespace
- Landing page built separately from the authenticated app shell, single clear CTA

**Frontend Migration Requirements:**
- AlgoRank: React 19 → React 18 (downgrade)
- AI Interview: React 18 ✅ (no change)
- Resume Builder: Migrate to React 18 + TypeScript
- Senior Connect: Migrate to React 18 + TypeScript

## 9. Team workflow

- Monorepo, npm workspaces
- `main` = stable/demo branch
- Feature branches per module: `feature/interview`, `feature/algorank`, `feature/resume`, `feature/connect`
- Single integrator reviews and merges all PRs
- Shared Prisma schema changes require integrator review before merge to avoid migration conflicts

## 10. Phased plan — 4 weeks, AI-agent-assisted, parallel tracks

### Week 1 — Foundation + Data Migration Setup

**Monorepo & Infrastructure:**
- Monorepo scaffold (npm workspaces), CI basics
- Set up PostgreSQL database (local or Neon dev tier)
- Create MongoDB to PostgreSQL migration pipeline
- Prepare Supabase to Prisma migration scripts (for friend's backend)

**Shared Foundation:**
- Unified Prisma schema design (accounting for all data models)
- Shared JWT auth middleware + `requireRole()` (using AlgoRank as base)
- App shell: navbar, sidebar, routing skeleton (React 18 + shadcn/ui)
- TypeScript type definitions for shared models

**Exit Criteria:** Monorepo structure, unified Prisma schema, auth system working, empty module routes accessible

### Week 2 — Parallel Module Porting (Data Layer Focus)

**`feature/algorank`:**
- Backend: Minimal changes (already uses Prisma + JWT)
- Frontend: Downgrade from React 19 to React 18
- Integrate with unified User model

**`feature/resume`:**
- Backend: MongoDB → Prisma migration
- Backend: Integrate with shared JWT auth
- Frontend: Migrate to React 18 + TypeScript
- Preserve ImageKit integration

**`feature/interview`:**
- Backend: Integrate friend's Prisma backend
- Backend: Replace Supabase Auth with JWT
- Frontend: Update to shared tech stack
- Preserve AI integration (OpenAI/OpenRouter)

**`feature/connect`:**
- Backend: MongoDB → Prisma migration
- Backend: Integrate with shared JWT auth
- Frontend: Migrate to React 18 + TypeScript
- Preserve Jitsi integration (URL generation)

**Exit Criteria:** All four modules functional independently behind shared auth, data migrations completed

### Week 3 — Frontend Integration + Design System

**Frontend Unification:**
- All modules: Migrate to shared app shell
- Apply shadcn/ui components across all modules
- Implement consistent routing and navigation
- Apply unified design system (colors, typography, spacing)

**Dashboard & Features:**
- Unified dashboard endpoint + page (parallel aggregate queries)
- Cross-module navigation and user flow
- Landing page with clear CTAs

**Exit Criteria:** All four modules reachable from shared shell, consistent UI/UX, dashboard shows real stats

### Week 4 — Polish + Testing

**Testing & Validation:**
- End-to-end testing of all modules
- Data validation: ensure migrations preserved all data correctly
- Performance testing of unified queries
- Cross-module integration testing

**Proctoring (if in scope):**
- Proctoring ML service integration (if spec is ready by Week 2)
- Otherwise, present as "future work" in demo

**Demo Preparation:**
- Seed data for comprehensive demo
- Run full app end-to-end on localhost
- Demo script, README, documentation

**Exit Criteria:** All four modules work end-to-end on localhost, demoable from single `npm run dev`

## 11. Integration Assumptions (Validated)

### Piston Integration (AlgoRank)
✅ **Confirmed Working:**
- URL: `http://localhost:2000/api/v2/execute`
- Languages: Python 3.12.0, JavaScript 20.11.1, CPP 10.2.0, Java 15.0.2
- Implementation: `backend/src/libs/pistonlibs.js`
- No changes needed

### Jitsi Integration (Senior Connect)
✅ **Confirmed Working:**
- Public Jitsi Meet servers (no API key required)
- URL generation: `https://meet.jit.si/seniorconnect-session-{bookingId}`
- Features: Video/Audio, Screen Sharing, Chat, Recording, Password Protection
- No infrastructure setup required
- No changes needed

### AI Integration
✅ **Confirmed Working:**
- Resume Builder: Google Generative AI + OpenAI
- AI Interview: OpenAI/OpenRouter (friend handling backend)
- No changes needed to existing integrations

## 12. Risk Mitigation

### Data Migration Risks
**Risk:** Data loss during MongoDB → PostgreSQL migration
**Mitigation:**
- Create comprehensive backup scripts
- Run test migrations on sample data
- Validate data integrity after migration
- Keep MongoDB databases running until PostgreSQL is fully verified
- Create rollback procedures

### Timeline Risks
**Risk:** 4 weeks too tight for complex migrations
**Mitigation:**
- Prioritize core functionality over UI polish
- Defer advanced features (proctoring, complex analytics) to v2
- Use agent assistance for parallel development
- Focus on data layer integrity in Week 2

### Integration Risks
**Risk:** Friend's AI Interview backend conversion delays
**Mitigation:**
- Create stub endpoints that match expected API contract
- Use Supabase directly until backend is ready
- Design API contract upfront for smooth integration

### Frontend Migration Risks
**Risk:** React version downgrade or framework migration issues
**Mitigation:**
- Test React 18 compatibility with AlgoRank components
- Incremental migration for Resume Builder and Senior Connect
- Use TypeScript to catch type issues early

## 13. Success Criteria

- Single login works across all four modules
- Unified dashboard shows accurate cross-module statistics
- All data migrations completed without data loss
- Consistent UI/UX across all modules
- All modules functional end-to-end on localhost
- Demo-ready from single `npm run dev` command
- Comprehensive documentation for future development

## 14. Open Questions & Dependencies

### Friend's AI Interview Backend
- When will the Supabase → Prisma conversion be completed?
- What is the expected API contract for the interview endpoints?
- Are there any specific AI integration requirements?

### Proctoring ML Service
- What should the proctoring service detect? (face presence, gaze, tab-switching, etc.)
- What model/library should be used?
- What is the REST contract with `apps/api`?
- Decision needed by end of Week 2: build, stub, or defer to v2

### ImageKit Integration (Resume Builder)
- Are any changes needed post-migration?
- Should we keep ImageKit or migrate to a different solution?

## 15. Validation Workflow Completed

This PRD has been validated against the actual legacy codebases:
- ✅ AlgoRank: PostgreSQL + Prisma + JWT (confirmed)
- ✅ Resume Builder: MongoDB + Mongoose + JWT (migration required)
- ✅ AI Interview: Supabase + Supabase Auth (friend converting to Prisma + JWT)
- ✅ Senior Connect: MongoDB + Mongoose + JWT (migration required)
- ✅ Piston integration: Confirmed working
- ✅ Jitsi integration: Confirmed working
- ✅ AI integrations: Confirmed working

All assumptions have been corrected based on actual implementations.