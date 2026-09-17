/*
  Warnings:

  - You are about to drop the column `codeSnippet` on the `Problem` table. All the data in the column will be lost.
  - You are about to drop the column `refrenceSoln` on the `Problem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Problem" DROP COLUMN "codeSnippet",
DROP COLUMN "refrenceSoln",
ADD COLUMN     "codeSnippets" JSONB,
ADD COLUMN     "refrenceSolutions" JSONB;
