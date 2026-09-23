-- AlterTable
ALTER TABLE "SessionBooking" ADD COLUMN     "availabilitySlotId" TEXT;

-- CreateIndex
CREATE INDEX "SessionBooking_availabilitySlotId_idx" ON "SessionBooking"("availabilitySlotId");

-- AddForeignKey
ALTER TABLE "SessionBooking" ADD CONSTRAINT "SessionBooking_availabilitySlotId_fkey" FOREIGN KEY ("availabilitySlotId") REFERENCES "AvailabilitySlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;