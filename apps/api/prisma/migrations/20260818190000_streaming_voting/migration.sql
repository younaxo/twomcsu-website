CREATE TYPE "StreamPlatform" AS ENUM ('TWITCH', 'YOUTUBE');

CREATE TABLE "stream_channels" (
  "id" TEXT NOT NULL,
  "platform" "StreamPlatform" NOT NULL,
  "channelKey" TEXT NOT NULL,
  "channelUrl" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "avatarUrl" TEXT,
  "userId" TEXT,
  "isPartner" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isLive" BOOLEAN NOT NULL DEFAULT false,
  "title" TEXT,
  "thumbnailUrl" TEXT,
  "liveUrl" TEXT,
  "viewerCount" INTEGER NOT NULL DEFAULT 0,
  "startedAt" TIMESTAMP(3),
  "lastCheckedAt" TIMESTAMP(3),
  "checkError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "stream_channels_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stream_channels_platform_channelKey_key" ON "stream_channels"("platform", "channelKey");
CREATE INDEX "stream_channels_isActive_isLive_idx" ON "stream_channels"("isActive", "isLive");
CREATE INDEX "stream_channels_isPartner_idx" ON "stream_channels"("isPartner");
CREATE INDEX "stream_channels_userId_idx" ON "stream_channels"("userId");
ALTER TABLE "stream_channels" ADD CONSTRAINT "stream_channels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "vote_sites" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "url" TEXT NOT NULL,
  "logoUrl" TEXT,
  "rewardCoins" INTEGER NOT NULL DEFAULT 10,
  "cooldownHours" INTEGER NOT NULL DEFAULT 24,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "webhookSecretHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "vote_sites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "vote_sites_slug_key" ON "vote_sites"("slug");
CREATE INDEX "vote_sites_isActive_sortOrder_idx" ON "vote_sites"("isActive", "sortOrder");

CREATE TABLE "player_votes" (
  "id" TEXT NOT NULL,
  "siteId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "externalId" TEXT,
  "rewardCoins" INTEGER NOT NULL,
  "votedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "player_votes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "player_votes_siteId_externalId_key" ON "player_votes"("siteId", "externalId");
CREATE INDEX "player_votes_userId_votedAt_idx" ON "player_votes"("userId", "votedAt");
CREATE INDEX "player_votes_siteId_votedAt_idx" ON "player_votes"("siteId", "votedAt");
ALTER TABLE "player_votes" ADD CONSTRAINT "player_votes_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "vote_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "player_votes" ADD CONSTRAINT "player_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
