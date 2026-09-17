-- AlterTable
ALTER TABLE "User" ADD COLUMN     "acceptanceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "averageSolveTime" DOUBLE PRECISION,
ADD COLUMN     "currentStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastSolvedDate" TIMESTAMP(3),
ADD COLUMN     "longestStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rankingScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalProblemsSolved" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "User_totalProblemsSolved_idx" ON "User"("totalProblemsSolved");

-- CreateIndex
CREATE INDEX "User_rankingScore_idx" ON "User"("rankingScore");

-- CreateIndex
CREATE INDEX "User_lastSolvedDate_idx" ON "User"("lastSolvedDate");
