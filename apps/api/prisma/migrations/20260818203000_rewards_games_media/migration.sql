ALTER TABLE "user_media_badges"
ADD COLUMN "rank" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "promoCodeId" TEXT;

CREATE UNIQUE INDEX "user_media_badges_promoCodeId_key" ON "user_media_badges"("promoCodeId");
ALTER TABLE "user_media_badges" ADD CONSTRAINT "user_media_badges_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "promo_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TYPE "RewardRarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

CREATE TABLE "daily_reward_claims" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "claimDay" TEXT NOT NULL,
  "streak" INTEGER NOT NULL,
  "reward" INTEGER NOT NULL,
  "cardIndex" INTEGER NOT NULL,
  "rarity" "RewardRarity" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "daily_reward_claims_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "daily_reward_claims_userId_claimDay_key" ON "daily_reward_claims"("userId", "claimDay");
CREATE INDEX "daily_reward_claims_userId_createdAt_idx" ON "daily_reward_claims"("userId", "createdAt");
ALTER TABLE "daily_reward_claims" ADD CONSTRAINT "daily_reward_claims_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "wheel_spins" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "reward" INTEGER NOT NULL,
  "segment" INTEGER NOT NULL,
  "weekKey" TEXT NOT NULL,
  "rarity" "RewardRarity" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wheel_spins_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "wheel_spins_userId_createdAt_idx" ON "wheel_spins"("userId", "createdAt");
CREATE UNIQUE INDEX "wheel_spins_userId_weekKey_key" ON "wheel_spins"("userId", "weekKey");
ALTER TABLE "wheel_spins" ADD CONSTRAINT "wheel_spins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TYPE "MiniGameType" AS ENUM ('ROULETTE', 'CRASH', 'UPGRADER');
CREATE TABLE "game_rounds" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "game" "MiniGameType" NOT NULL,
  "betAmount" INTEGER NOT NULL,
  "payoutAmount" INTEGER NOT NULL,
  "multiplier" DOUBLE PRECISION NOT NULL,
  "won" BOOLEAN NOT NULL,
  "result" JSONB NOT NULL,
  "serverSeed" TEXT NOT NULL,
  "serverSeedHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "game_rounds_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "game_rounds_userId_createdAt_idx" ON "game_rounds"("userId", "createdAt");
CREATE INDEX "game_rounds_game_createdAt_idx" ON "game_rounds"("game", "createdAt");
ALTER TABLE "game_rounds" ADD CONSTRAINT "game_rounds_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "users" ADD CONSTRAINT "users_referredBy_fkey" FOREIGN KEY ("referredBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "users_referredBy_idx" ON "users"("referredBy");

CREATE TABLE "referral_rewards" (
  "id" TEXT NOT NULL,
  "inviterId" TEXT NOT NULL,
  "invitedUserId" TEXT NOT NULL,
  "level" INTEGER NOT NULL,
  "reward" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "referral_rewards_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "referral_rewards_inviterId_invitedUserId_key" ON "referral_rewards"("inviterId", "invitedUserId");
CREATE INDEX "referral_rewards_inviterId_createdAt_idx" ON "referral_rewards"("inviterId", "createdAt");
CREATE INDEX "referral_rewards_invitedUserId_idx" ON "referral_rewards"("invitedUserId");
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
