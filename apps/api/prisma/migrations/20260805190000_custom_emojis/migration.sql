-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'NEWS_COMMENT_MENTION';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REPORT_MENTION';

-- CreateTable
CREATE TABLE "custom_emojis" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(32) NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "category" TEXT,
    "isAnimated" BOOLEAN NOT NULL DEFAULT false,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_emojis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_emojis_name_key" ON "custom_emojis"("name");

-- CreateIndex
CREATE INDEX "custom_emojis_name_idx" ON "custom_emojis"("name");

-- CreateIndex
CREATE INDEX "custom_emojis_category_idx" ON "custom_emojis"("category");

-- CreateIndex
CREATE INDEX "custom_emojis_isActive_idx" ON "custom_emojis"("isActive");
