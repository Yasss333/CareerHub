ALTER TABLE "InterviewSession"
  ADD COLUMN "monitoringMode" TEXT NOT NULL DEFAULT 'practice',
  ADD COLUMN "screenConsentAt" TIMESTAMP(3),
  ADD COLUMN "introductionRequired" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "candidateIntroduction" TEXT,
  ADD COLUMN "introductionCompletedAt" TIMESTAMP(3);

CREATE TABLE "AdminAudit" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAudit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AdminAudit_createdAt_idx" ON "AdminAudit"("createdAt");
ALTER TABLE "AdminAudit" ADD CONSTRAINT "AdminAudit_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
