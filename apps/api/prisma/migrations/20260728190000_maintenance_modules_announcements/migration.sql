-- AlterTable announcements: rename schedule columns and add banner fields
ALTER TABLE "announcements" RENAME COLUMN "startsAt" TO "showFrom";
ALTER TABLE "announcements" RENAME COLUMN "endsAt" TO "showUntil";
ALTER TABLE "announcements" ADD COLUMN "isDismissible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "announcements" ADD COLUMN "targetRole" TEXT;
ALTER TABLE "announcements" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "announcements" ADD COLUMN "createdBy" TEXT;

DROP INDEX IF EXISTS "announcements_isActive_startsAt_endsAt_idx";
CREATE INDEX "announcements_isActive_showFrom_showUntil_idx" ON "announcements"("isActive", "showFrom", "showUntil");

-- CreateTable
CREATE TABLE "maintenance_mode" (
    "id" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT NOT NULL DEFAULT 'Технические работы',
    "message" TEXT NOT NULL DEFAULT 'Сайт временно недоступен. Работы ведутся, скоро всё заработает!',
    "estimatedEnd" TIMESTAMP(3),
    "enabledBy" TEXT,
    "enabledAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_mode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_statuses" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "disabledBy" TEXT,
    "disabledAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_statuses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "module_statuses_module_key" ON "module_statuses"("module");
CREATE INDEX "module_statuses_module_idx" ON "module_statuses"("module");
