-- AlterTable
ALTER TABLE "users" ADD COLUMN "lastActivityAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "users_lastActivityAt_idx" ON "users"("lastActivityAt");

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN "severity" TEXT NOT NULL DEFAULT 'info';
ALTER TABLE "audit_logs" ADD COLUMN "duration" INTEGER;

-- CreateIndex
CREATE INDEX "audit_logs_severity_idx" ON "audit_logs"("severity");

-- CreateTable
CREATE TABLE "admin_bookmarks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_bookmarks_userId_idx" ON "admin_bookmarks"("userId");

-- AddForeignKey
ALTER TABLE "admin_bookmarks" ADD CONSTRAINT "admin_bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "saved_filters" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_filters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_filters_userId_page_idx" ON "saved_filters"("userId", "page");

-- AddForeignKey
ALTER TABLE "saved_filters" ADD CONSTRAINT "saved_filters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "scheduled_exports" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "filters" JSONB,
    "schedule" TEXT NOT NULL,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_exports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduled_exports_userId_idx" ON "scheduled_exports"("userId");

-- CreateIndex
CREATE INDEX "scheduled_exports_nextRunAt_isActive_idx" ON "scheduled_exports"("nextRunAt", "isActive");

-- AddForeignKey
ALTER TABLE "scheduled_exports" ADD CONSTRAINT "scheduled_exports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "site_settings_config" (
    "id" TEXT NOT NULL,
    "siteName" TEXT NOT NULL DEFAULT 'TWOMC',
    "siteDescription" TEXT,
    "siteLogo" TEXT,
    "siteFavicon" TEXT,
    "contactEmail" TEXT,
    "discordInvite" TEXT,
    "vkGroup" TEXT,
    "telegramChannel" TEXT,
    "youtubeChannel" TEXT,
    "registrationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "registrationRequiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "maxUsersLimit" INTEGER,
    "autoModeration" BOOLEAN NOT NULL DEFAULT true,
    "profanityFilter" BOOLEAN NOT NULL DEFAULT true,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "metaKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "googleAnalyticsId" TEXT,
    "yandexMetrikaId" TEXT,
    "chatEnabled" BOOLEAN NOT NULL DEFAULT true,
    "friendsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "storeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "commentsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "newsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reportsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "requireAdmin2fa" BOOLEAN NOT NULL DEFAULT false,
    "ipWhitelist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_config_pkey" PRIMARY KEY ("id")
);
