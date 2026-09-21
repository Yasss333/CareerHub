# CareerHub Database Schema

## Overview
This document describes the PostgreSQL database schema for the CareerHub platform, managed through Prisma ORM.

## Database Configuration

### Technology Stack
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Connection**: Local development via Docker container
- **Default Port**: 5432
- **Database Name**: careerhub (development)

### Prisma Configuration
- **Schema File**: `apps/api/prisma/schema.prisma`
- **Migration Location**: `apps/api/prisma/migrations`
- **Client Generation**: `apps/api/prisma/client`

## Core Models

### User Model
The central user model for authentication and profile management.

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String
  name          String?
  role          String    @default("USER")
  isAlumniMentor Boolean  @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  resumes           Resume[]
  seniorProfile     SeniorProfile?      @relation("SeniorProfile")
  sessionBookings   SessionBooking[]    @relation("JuniorSessions")
  submissions       Submission[]
  playlists         Playlist[]
  comments          Comment[]
  likes             Like[]
  interviewSessions InterviewSession[]
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `email`: User email (unique)
- `password`: Hashed password (bcrypt)
- `name`: User display name
- `role`: User role (USER, ADMIN)
- `isAlumniMentor`: Alumni mentor capability flag
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp

**Relations**:
- One-to-many with Resume
- One-to-one with SeniorProfile
- One-to-many with SessionBooking (as junior)
- One-to-many with Submission
- One-to-many with Playlist
- One-to-many with Comment
- One-to-many with Like
- One-to-many with InterviewSession

## Resume Builder Models

### Resume Model
User resume data with template and content information.

```prisma
model Resume {
  id              String   @id @default(uuid())
  userId          String
  title           String
  public          Boolean  @default(false)
  template        String   @default("modern")
  accentColor     String   @default("#3b82f6")
  professionSummary String? @map("profession_summary")
  skills          String[]
  personalInfo     Json?
  experience      Json?
  projects        Json?
  education       Json?
  profile         Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `userId`: Reference to User
- `title`: Resume title
- `public`: Public visibility flag
- `template`: Template style (modern, classic, etc.)
- `accentColor`: Theme accent color
- `professionSummary`: Professional summary text
- `skills`: Array of skill strings
- `personalInfo`: JSON object for personal information
- `experience`: JSON array for work experience
- `projects`: JSON array for projects
- `education`: JSON array for education
- `profile`: JSON object for profile details
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

**Relations**:
- Many-to-one with User (cascade delete)

**JSON Schema Notes**:
- `personalInfo`: name, email, phone, location, linkedin, github
- `experience`: Array of objects with company, role, dates, description
- `projects`: Array of objects with name, description, technologies, link
- `education`: Array of objects with institution, degree, dates, details

## Senior Connect Models

### SeniorProfile Model
Alumni mentor profile information.

```prisma
model SeniorProfile {
  id          String   @id @default(uuid())
  userId      String   @unique
  bio         String?
  expertise   String[]
  linkedinUrl String?  @map("linkedin_url")
  githubUrl   String?  @map("github_url")
  hourlyRate  Int?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user         User              @relation("SeniorProfile", fields: [userId], references: [id], onDelete: Cascade)
  availability AvailabilitySlot[]
  sessions     SessionBooking[]
  feedback     SessionFeedback[]
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `userId`: Reference to User (unique)
- `bio`: Professional biography
- `expertise`: Array of expertise areas
- `linkedinUrl`: LinkedIn profile URL
- `githubUrl`: GitHub profile URL
- `hourlyRate`: Hourly rate for sessions (cents)
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

**Relations**:
- One-to-one with User (cascade delete)
- One-to-many with AvailabilitySlot
- One-to-many with SessionBooking
- One-to-many with SessionFeedback

### AvailabilitySlot Model
Mentor availability time slots.

```prisma
model AvailabilitySlot {
  id          String   @id @default(uuid())
  seniorId    String
  dayOfWeek   Int
  startTime   String
  endTime     String
  isAvailable Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  senior SeniorProfile @relation(fields: [seniorId], references: [id], onDelete: Cascade)
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `seniorId`: Reference to SeniorProfile
- `dayOfWeek`: Day of week (0-6, Sunday-Saturday)
- `startTime`: Start time in HH:MM format
- `endTime`: End time in HH:MM format
- `isAvailable`: Availability status
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

**Relations**:
- Many-to-one with SeniorProfile (cascade delete)

### SessionBooking Model
Mentorship session bookings.

```prisma
model SessionBooking {
  id        String   @id @default(uuid())
  seniorId  String
  juniorId  String
  startTime DateTime
  endTime   DateTime
  status    String   @default("scheduled")
  jitsiUrl  String?  @map("jitsi_url")
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  senior  SeniorProfile  @relation(fields: [seniorId], references: [id], onDelete: Cascade)
  junior  User           @relation("JuniorSessions", fields: [juniorId], references: [id], onDelete: Cascade)
  feedback SessionFeedback[]
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `seniorId`: Reference to SeniorProfile
- `juniorId`: Reference to User
- `startTime`: Session start datetime
- `endTime`: Session end datetime
- `status`: Session status (scheduled, completed, cancelled)
- `jitsiUrl`: Jitsi meeting URL
- `notes`: Session notes
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

**Relations**:
- Many-to-one with SeniorProfile (cascade delete)
- Many-to-one with User as junior (cascade delete)
- One-to-many with SessionFeedback

### SessionFeedback Model
Feedback for mentorship sessions.

```prisma
model SessionFeedback {
  id        String   @id @default(uuid())
  bookingId String
  rating    Int
  comment   String?
  createdAt DateTime @default(now())

  booking SessionBooking @relation(fields: [bookingId], references: [id], onDelete: Cascade)
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `bookingId`: Reference to SessionBooking
- `rating`: Rating score (1-5)
- `comment`: Feedback comment text
- `createdAt`: Creation timestamp

**Relations**:
- Many-to-one with SessionBooking (cascade delete)

## AlgoRank Models

### Problem Model
DSA coding problems.

```prisma
model Problem {
  id          String   @id @default(uuid())
  title       String
  description String
  difficulty  String   @default("medium")
  tags        String[]
  examples    Json?
  constraints String?
  timeLimit   Int      @default(1)
  memoryLimit Int      @default(256)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  submissions Submission[]
  playlists   Playlist[]
  comments    Comment[]
  likes       Like[]
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `title`: Problem title
- `description`: Problem description
- `difficulty`: Difficulty level (easy, medium, hard)
- `tags`: Array of topic tags
- `examples`: JSON array of example inputs/outputs
- `constraints`: Problem constraints description
- `timeLimit`: Time limit in seconds
- `memoryLimit`: Memory limit in MB
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

**Relations**:
- One-to-many with Submission
- One-to-many with Playlist
- One-to-many with Comment
- One-to-many with Like

### Submission Model
Code submissions for problems.

```prisma
model Submission {
  id        String   @id @default(uuid())
  problemId String
  userId    String
  code      String
  language  String
  status    String   @default("pending")
  runtime   Int?
  memory    Int?
  createdAt DateTime @default(now())

  problem Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `problemId`: Reference to Problem
- `userId`: Reference to User
- `code`: Submitted code
- `language`: Programming language
- `status`: Submission status (pending, accepted, rejected, error)
- `runtime`: Execution time in milliseconds
- `memory`: Memory usage in KB
- `createdAt`: Creation timestamp

**Relations**:
- Many-to-one with Problem (cascade delete)
- Many-to-one with User (cascade delete)

### Playlist Model
User-created problem playlists.

```prisma
model Playlist {
  id          String   @id @default(uuid())
  name        String
  description String?
  problemIds  String[]
  userId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  problems Problem[]
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `name`: Playlist name
- `description`: Playlist description
- `problemIds`: Array of problem IDs
- `userId`: Reference to User
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

**Relations**:
- Many-to-one with User (cascade delete)
- Many-to-many with Problem

### Comment Model
Comments on problems.

```prisma
model Comment {
  id        String   @id @default(uuid())
  problemId String
  userId    String
  content   String
  createdAt DateTime @default(now())

  problem Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `problemId`: Reference to Problem
- `userId`: Reference to User
- `content`: Comment text
- `createdAt`: Creation timestamp

**Relations**:
- Many-to-one with Problem (cascade delete)
- Many-to-one with User (cascade delete)

### Like Model
User likes on problems.

```prisma
model Like {
  id        String   @id @default(uuid())
  problemId String
  userId    String
  createdAt DateTime @default(now())

  problem Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `problemId`: Reference to Problem
- `userId`: Reference to User
- `createdAt`: Creation timestamp

**Relations**:
- Many-to-one with Problem (cascade delete)
- Many-to-one with User (cascade delete)

## AI Interview Models

### InterviewSession Model (Current - Needs Extension)
AI interview session information.

```prisma
model InterviewSession {
  id              String   @id @default(uuid())
  userId          String
  type            String   @default("custom")
  topics          String[]
  role            String?
  experienceLevel String?
  plannedDuration Int      @default(30)
  cameraEnabled   Boolean  @default(false)
  status          String   @default("in_progress")
  startedAt       DateTime @default(now())
  endedAt         DateTime?
  durationSeconds Int?
  feedback        Json?

  user      User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  questions InterviewQuestion[]
  createdAt DateTime           @default(now())
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `userId`: Reference to User
- `type`: Interview type (custom, quick, role-specific)
- `topics`: Array of interview topics
- `role`: Target role for interview
- `experienceLevel`: Experience level target
- `plannedDuration`: Planned duration in minutes
- `cameraEnabled`: Camera usage flag
- `status`: Session status (in_progress, completed, cancelled)
- `startedAt`: Session start timestamp
- `endedAt`: Session end timestamp
- `durationSeconds`: Actual duration in seconds
- `feedback`: JSON object for session feedback
- `createdAt`: Creation timestamp

**Relations**:
- Many-to-one with User (cascade delete)
- One-to-many with InterviewQuestion

### InterviewQuestion Model (Current - Needs Extension)
Individual questions within an interview session.

```prisma
model InterviewQuestion {
  id               String   @id @default(uuid())
  sessionId        String
  questionText     String
  questionIndex    Int
  category         String?
  answerText       String?
  answeredAt       DateTime?
  questionFeedback Json?

  session   InterviewSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  createdAt DateTime          @default(now())
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `sessionId`: Reference to InterviewSession
- `questionText`: Question text
- `questionIndex`: Question order in session
- `category`: Question category
- `answerText`: User's answer text
- `answeredAt`: Answer timestamp
- `questionFeedback`: JSON object for question feedback
- `createdAt`: Creation timestamp

**Relations**:
- Many-to-one with InterviewSession (cascade delete)

### Additional Models Needed (Not Yet Implemented)

#### EmotionResult Model
Facial, voice, and text emotion analysis results.

```prisma
model EmotionResult {
  id           String   @id @default(uuid())
  questionId   String
  type         String   // face, voice, text
  emotions     Json     // emotion scores and labels
  confidence   Float?
  timestamp    DateTime @default(now())

  question InterviewQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)
}
```

#### ProctoringEvent Model
Proctoring alerts and events.

```prisma
model ProctoringEvent {
  id          String   @id @default(uuid())
  sessionId   String
  eventType   String   // gaze_away, multiple_faces, no_face, etc.
  severity    String   // low, medium, high
  timestamp   DateTime @default(now())
  metadata    Json?

  session InterviewSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}
```

#### FaceVerification Model
Face verification events and results.

```prisma
model FaceVerification {
  id          String   @id @default(uuid())
  sessionId   String
  verified    Boolean
  confidence  Float?
  timestamp   DateTime @default(now())
  imageData   String?  // reference to stored image

  session InterviewSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}
```

#### BehavioralMetric Model
Behavioral analysis metrics.

```prisma
model BehavioralMetric {
  id          String   @id @default(uuid())
  sessionId   String
  metricType  String   // eye_contact, speaking_time, filler_words, etc.
  value       Float
  unit        String?
  timestamp   DateTime @default(now())

  session InterviewSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}
```

## Indexes

### Current Indexes
- Primary keys on all models (id fields)
- Unique constraints on User.email, SeniorProfile.userId
- Foreign key indexes on all relation fields

### Recommended Additional Indexes
- `User.email` (already unique)
- `Resume.userId` for user resume queries
- `SeniorProfile.userId` (already unique)
- `AvailabilitySlot.seniorId` for mentor availability queries
- `SessionBooking.seniorId` for mentor session queries
- `SessionBooking.juniorId` for junior session queries
- `SessionBooking.status` for status filtering
- `Problem.difficulty` for difficulty filtering
- `Submission.userId` for user submission history
- `Submission.problemId` for problem submission analysis
- `InterviewSession.userId` for user session history
- `InterviewSession.status` for status filtering

## Data Integrity

### Cascade Deletes
- User deletion cascades to: Resume, SeniorProfile, SessionBooking (as junior), Submission, Playlist, Comment, Like, InterviewSession
- Problem deletion cascades to: Submission, Comment, Like
- SessionBooking deletion cascades to: SessionFeedback
- InterviewSession deletion cascades to: InterviewQuestion

### Constraints
- Email uniqueness for users
- SeniorProfile userId uniqueness
- Valid status enums for all status fields
- Valid difficulty levels for problems
- Rating range (1-5) for feedback

## Migration Strategy

### Development Workflow
1. Modify `apps/api/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <description>`
3. Review generated migration
4. Apply migration to development database
5. Test changes with development data

### Production Workflow
1. Create migration in development
2. Test migration thoroughly
3. Review migration SQL
4. Backup production database
5. Apply migration to production
6. Verify production data integrity

### Rollback Strategy
- Prisma migrations can be rolled back
- Keep recent migrations for rollback capability
- Test rollback procedures in development

## Performance Considerations

### Query Optimization
- Use indexes on frequently queried fields
- Avoid N+1 queries with proper eager loading
- Use pagination for large result sets
- Optimize JSON field queries

### Connection Pooling
- Prisma manages connection pooling
- Configure pool size based on load
- Monitor connection usage

### Data Archival
- Consider archival for old submissions
- Archive old interview sessions
- Purge old proctoring events
- Implement data retention policies

## Security Considerations

### Data Encryption
- Passwords hashed with bcrypt
- Sensitive JSON fields should be encrypted (future)
- Consider encryption for interview recordings

### Access Control
- Application-level access control via JWT
- Database-level permissions (future)
- Row-level security for multi-tenant scenarios (future)

### Data Privacy
- Biometric data requires special handling
- Interview data contains sensitive information
- Implement data deletion capabilities
- Comply with data protection regulations

## Future Schema Extensions

### Planned Additions
- Extended AI Interview schema for emotion/proctoring data
- User preference settings
- Notification system tables
- Analytics and reporting tables
- Audit logging tables
- Payment/subscription tables (if monetization added)

### Schema Evolution Principles
- Maintain backward compatibility where possible
- Use migrations for all schema changes
- Document breaking changes
- Test migrations thoroughly
- Plan for data migration when changing structure