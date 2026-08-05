-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('DISCORD', 'TELEGRAM', 'VK', 'YOUTUBE', 'TWITCH', 'TIKTOK', 'STEAM');

-- CreateEnum
CREATE TYPE "MediaGroup" AS ENUM ('YOUTUBE', 'TWITCH', 'TIKTOK');

-- CreateEnum
CREATE TYPE "UserBadgeType" AS ENUM ('VERIFIED', 'SUBSCRIBER_PLUS', 'PROJECT_TEAM', 'DEVELOPERS_TEAM');

-- CreateEnum
CREATE TYPE "MediaBadgeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProfileReportReason" AS ENUM ('SPAM', 'INAPPROPRIATE_CONTENT', 'HARASSMENT', 'IMPERSONATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ProfileReportStatus" AS ENUM ('PENDING', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'DISLIKE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "banner" TEXT,
ADD COLUMN     "bannerPreset" TEXT,
ADD COLUMN     "bio" VARCHAR(500),
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "city" VARCHAR(100),
ADD COLUMN     "country" TEXT,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "hideBirthDate" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "hideCity" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hideComments" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hideCountry" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hideEmail" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "hideGender" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hideInventory" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hideServices" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hideSocials" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hideStatistics" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isProfilePrivate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showBirthDate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "statusText" VARCHAR(128);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "UserBadgeType" NOT NULL,
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_links" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_media_badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mediaGroup" "MediaGroup" NOT NULL,
    "channelUrl" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_media_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_badge_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mediaGroup" "MediaGroup" NOT NULL,
    "channelUrl" TEXT NOT NULL,
    "description" TEXT,
    "status" "MediaBadgeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_badge_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banner_presets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "banner_presets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_views" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_reactions" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_reports" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" "ProfileReportReason" NOT NULL,
    "description" TEXT,
    "status" "ProfileReportStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_statistics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "playTime" INTEGER NOT NULL DEFAULT 0,
    "kills" INTEGER NOT NULL DEFAULT 0,
    "deaths" INTEGER NOT NULL DEFAULT 0,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "killDeathRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastServer" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "awards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "iconUrl" TEXT NOT NULL,
    "color" TEXT,
    "rarity" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "awards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_awards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "awardId" TEXT NOT NULL,
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_awards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_badges_userId_idx" ON "user_badges"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_userId_type_key" ON "user_badges"("userId", "type");

-- CreateIndex
CREATE INDEX "social_links_userId_idx" ON "social_links"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "social_links_userId_platform_key" ON "social_links"("userId", "platform");

-- CreateIndex
CREATE INDEX "user_media_badges_userId_idx" ON "user_media_badges"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_media_badges_userId_mediaGroup_key" ON "user_media_badges"("userId", "mediaGroup");

-- CreateIndex
CREATE INDEX "media_badge_requests_userId_idx" ON "media_badge_requests"("userId");

-- CreateIndex
CREATE INDEX "media_badge_requests_status_idx" ON "media_badge_requests"("status");

-- CreateIndex
CREATE INDEX "profile_views_profileId_idx" ON "profile_views"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "profile_views_profileId_viewerId_key" ON "profile_views"("profileId", "viewerId");

-- CreateIndex
CREATE INDEX "profile_reactions_profileId_idx" ON "profile_reactions"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "profile_reactions_profileId_userId_key" ON "profile_reactions"("profileId", "userId");

-- CreateIndex
CREATE INDEX "profile_reports_profileId_idx" ON "profile_reports"("profileId");

-- CreateIndex
CREATE INDEX "profile_reports_status_idx" ON "profile_reports"("status");

-- CreateIndex
CREATE UNIQUE INDEX "profile_reports_profileId_reporterId_key" ON "profile_reports"("profileId", "reporterId");

-- CreateIndex
CREATE UNIQUE INDEX "player_statistics_userId_key" ON "player_statistics"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "awards_slug_key" ON "awards"("slug");

-- CreateIndex
CREATE INDEX "user_awards_userId_idx" ON "user_awards"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_awards_userId_awardId_key" ON "user_awards"("userId", "awardId");

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_links" ADD CONSTRAINT "social_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_media_badges" ADD CONSTRAINT "user_media_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_badge_requests" ADD CONSTRAINT "media_badge_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_reactions" ADD CONSTRAINT "profile_reactions_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_reactions" ADD CONSTRAINT "profile_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_reports" ADD CONSTRAINT "profile_reports_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_reports" ADD CONSTRAINT "profile_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_statistics" ADD CONSTRAINT "player_statistics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_awards" ADD CONSTRAINT "user_awards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_awards" ADD CONSTRAINT "user_awards_awardId_fkey" FOREIGN KEY ("awardId") REFERENCES "awards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
