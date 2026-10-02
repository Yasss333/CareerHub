-- AlterTable
ALTER TABLE "AvailabilitySlot" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC';
