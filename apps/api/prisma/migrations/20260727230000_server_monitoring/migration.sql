-- AlterTable
ALTER TABLE "users" ADD COLUMN "currentServer" TEXT,
ADD COLUMN "currentServerId" TEXT,
ADD COLUMN "lastServerActivity" TIMESTAMP(3),
ADD COLUMN "isOnlineInGame" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "users_currentServerId_idx" ON "users"("currentServerId");

-- CreateIndex
CREATE INDEX "users_isOnlineInGame_idx" ON "users"("isOnlineInGame");

-- CreateTable
CREATE TABLE "servers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 25565,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "iconUrl" TEXT,
    "maxPlayers" INTEGER NOT NULL DEFAULT 100,
    "version" TEXT,
    "motd" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server_status_logs" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "online" BOOLEAN NOT NULL,
    "playerCount" INTEGER NOT NULL DEFAULT 0,
    "maxPlayers" INTEGER NOT NULL DEFAULT 0,
    "players" TEXT[],
    "version" TEXT,
    "motd" TEXT,
    "ping" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "server_status_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "servers_slug_key" ON "servers"("slug");

-- CreateIndex
CREATE INDEX "servers_slug_idx" ON "servers"("slug");

-- CreateIndex
CREATE INDEX "servers_isActive_order_idx" ON "servers"("isActive", "order");

-- CreateIndex
CREATE INDEX "server_status_logs_serverId_timestamp_idx" ON "server_status_logs"("serverId", "timestamp");

-- AddForeignKey
ALTER TABLE "server_status_logs" ADD CONSTRAINT "server_status_logs_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
