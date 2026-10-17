-- CreateTable
CREATE TABLE "PriSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "interviewScore" DOUBLE PRECISION NOT NULL,
    "algoRankScore" DOUBLE PRECISION NOT NULL,
    "resumeScore" DOUBLE PRECISION NOT NULL,
    "snapshotDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriSnapshot_userId_snapshotDate_idx" ON "PriSnapshot"("userId", "snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "PriSnapshot_userId_snapshotDate_key" ON "PriSnapshot"("userId", "snapshotDate");

-- AddForeignKey
ALTER TABLE "PriSnapshot" ADD CONSTRAINT "PriSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
