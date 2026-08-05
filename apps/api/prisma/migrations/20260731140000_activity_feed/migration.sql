-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM (
  'PURCHASE_MADE',
  'RANK_ACHIEVED',
  'ACHIEVEMENT_UNLOCKED',
  'BADGE_GRANTED',
  'AWARD_GRANTED',
  'GIFT_SENT',
  'GIFT_RECEIVED',
  'FRIENDSHIP_STARTED',
  'PROFILE_UPDATED',
  'NEWS_POSTED',
  'EVENT_ANNOUNCED',
  'MILESTONE_REACHED',
  'JOINED_SERVER',
  'TOP_ACHIEVED',
  'MEDIA_APPROVED',
  'DONATOR_UPGRADED',
  'BIRTHDAY',
  'CUSTOM'
);

-- CreateEnum
CREATE TYPE "ActivityVisibility" AS ENUM ('PUBLIC', 'FRIENDS', 'PRIVATE');

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "visibility" "ActivityVisibility" NOT NULL DEFAULT 'PUBLIC',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "actionUrl" TEXT,
    "metadata" JSONB,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "hiddenReason" TEXT,
    "hiddenBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_reactions" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_comments" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentHtml" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_feed_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "showPurchases" BOOLEAN NOT NULL DEFAULT true,
    "showAchievements" BOOLEAN NOT NULL DEFAULT true,
    "showBadges" BOOLEAN NOT NULL DEFAULT true,
    "showAwards" BOOLEAN NOT NULL DEFAULT true,
    "showGifts" BOOLEAN NOT NULL DEFAULT true,
    "showFriendships" BOOLEAN NOT NULL DEFAULT true,
    "showProfileUpdates" BOOLEAN NOT NULL DEFAULT false,
    "showMilestones" BOOLEAN NOT NULL DEFAULT true,
    "showServerActivity" BOOLEAN NOT NULL DEFAULT true,
    "purchasesVisibility" "ActivityVisibility" NOT NULL DEFAULT 'FRIENDS',
    "achievementsVisibility" "ActivityVisibility" NOT NULL DEFAULT 'PUBLIC',
    "badgesVisibility" "ActivityVisibility" NOT NULL DEFAULT 'PUBLIC',
    "giftsVisibility" "ActivityVisibility" NOT NULL DEFAULT 'FRIENDS',
    "friendshipsVisibility" "ActivityVisibility" NOT NULL DEFAULT 'FRIENDS',
    "profileUpdatesVisibility" "ActivityVisibility" NOT NULL DEFAULT 'FRIENDS',
    "notifyOnComment" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnReaction" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_feed_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activities_userId_createdAt_idx" ON "activities"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "activities_type_createdAt_idx" ON "activities"("type", "createdAt");

-- CreateIndex
CREATE INDEX "activities_visibility_createdAt_idx" ON "activities"("visibility", "createdAt");

-- CreateIndex
CREATE INDEX "activities_isPinned_createdAt_idx" ON "activities"("isPinned", "createdAt");

-- CreateIndex
CREATE INDEX "activity_reactions_activityId_idx" ON "activity_reactions"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "activity_reactions_activityId_userId_key" ON "activity_reactions"("activityId", "userId");

-- CreateIndex
CREATE INDEX "activity_comments_activityId_createdAt_idx" ON "activity_comments"("activityId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "activity_feed_settings_userId_key" ON "activity_feed_settings"("userId");

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_reactions" ADD CONSTRAINT "activity_reactions_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_reactions" ADD CONSTRAINT "activity_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_comments" ADD CONSTRAINT "activity_comments_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_comments" ADD CONSTRAINT "activity_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_feed_settings" ADD CONSTRAINT "activity_feed_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
