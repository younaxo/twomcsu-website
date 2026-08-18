-- CreateEnum
CREATE TYPE "AchievementCategory" AS ENUM ('GAME', 'SOCIAL', 'DONATION', 'SPECIAL', 'DAILY', 'SECRET');

-- CreateEnum
CREATE TYPE "AchievementRarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC');

-- CreateEnum
CREATE TYPE "AchievementConditionType" AS ENUM (
  'PLAYTIME_MINUTES',
  'KILLS_COUNT',
  'DEATHS_COUNT',
  'FRIENDS_COUNT',
  'COMMENTS_COUNT',
  'LIKES_RECEIVED',
  'PURCHASES_COUNT',
  'TOTAL_SPENT',
  'GIFTS_SENT',
  'GIFTS_RECEIVED',
  'DAYS_STREAK',
  'ACCOUNT_AGE_DAYS',
  'PROFILE_VIEWS',
  'BADGES_COUNT',
  'REGISTRATION_ORDER',
  'BUG_REPORTED',
  'REPORTS_RESOLVED',
  'MANUAL',
  'CUSTOM'
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconUrl" TEXT NOT NULL,
    "category" "AchievementCategory" NOT NULL,
    "rarity" "AchievementRarity" NOT NULL,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "conditionType" "AchievementConditionType" NOT NULL,
    "conditionValue" INTEGER,
    "conditionParams" JSONB,
    "rewardRubies" INTEGER NOT NULL DEFAULT 0,
    "rewardBadgeType" TEXT,
    "rewardTitle" TEXT,
    "rewardMessage" TEXT,
    "unlockedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "currentProgress" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "isShowcased" BOOLEAN NOT NULL DEFAULT false,
    "showcaseOrder" INTEGER NOT NULL DEFAULT 0,
    "rewardsGranted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "achievements_slug_key" ON "achievements"("slug");

-- CreateIndex
CREATE INDEX "achievements_slug_idx" ON "achievements"("slug");

-- CreateIndex
CREATE INDEX "achievements_category_rarity_idx" ON "achievements"("category", "rarity");

-- CreateIndex
CREATE INDEX "user_achievements_userId_isCompleted_idx" ON "user_achievements"("userId", "isCompleted");

-- CreateIndex
CREATE INDEX "user_achievements_userId_isShowcased_idx" ON "user_achievements"("userId", "isShowcased");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_userId_achievementId_key" ON "user_achievements"("userId", "achievementId");

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
