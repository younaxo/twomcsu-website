-- AlterTable
ALTER TABLE "users" ADD COLUMN "displayBadgeId" TEXT;

-- CreateIndex
CREATE INDEX "users_displayBadgeId_idx" ON "users"("displayBadgeId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_displayBadgeId_fkey" FOREIGN KEY ("displayBadgeId") REFERENCES "user_badges"("id") ON DELETE SET NULL ON UPDATE CASCADE;
