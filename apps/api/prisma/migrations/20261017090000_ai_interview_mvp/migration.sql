ALTER TABLE "InterviewSession"
  ADD COLUMN IF NOT EXISTS "difficulty" TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS "cameraConsentAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "microphoneEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "microphoneConsentAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "modalityAvailability" JSONB;

ALTER TABLE "InterviewQuestion"
  ADD COLUMN IF NOT EXISTS "questionType" TEXT,
  ADD COLUMN IF NOT EXISTS "topic" TEXT,
  ADD COLUMN IF NOT EXISTS "difficulty" TEXT,
  ADD COLUMN IF NOT EXISTS "expectedAnswerPoints" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "evaluationCriteria" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE TABLE IF NOT EXISTS "EmotionResult" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "questionId" TEXT,
  "modality" TEXT NOT NULL,
  "result" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmotionResult_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EmotionResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EmotionResult_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "InterviewQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ProctoringEvent" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'info',
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProctoringEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProctoringEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "EmotionResult_sessionId_createdAt_idx" ON "EmotionResult"("sessionId", "createdAt");
CREATE INDEX IF NOT EXISTS "EmotionResult_questionId_idx" ON "EmotionResult"("questionId");
CREATE INDEX IF NOT EXISTS "ProctoringEvent_sessionId_createdAt_idx" ON "ProctoringEvent"("sessionId", "createdAt");
