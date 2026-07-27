-- CreateEnum
CREATE TYPE "RoleGroup" AS ENUM ('PLAYER', 'HELPER', 'MODERATOR', 'ADMIN', 'OWNER');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role",
ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "bannedUntil" TIMESTAMP(3),
ADD COLUMN     "isBanned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "lastLoginIp" TEXT,
ADD COLUMN     "minecraftNick" VARCHAR(16),
ADD COLUMN     "roleGroup" "RoleGroup" NOT NULL DEFAULT 'PLAYER',
ALTER COLUMN "username" SET DATA TYPE VARCHAR(16);

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_tokenHash_idx" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "users_minecraftNick_key" ON "users"("minecraftNick");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_minecraftNick_idx" ON "users"("minecraftNick");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
