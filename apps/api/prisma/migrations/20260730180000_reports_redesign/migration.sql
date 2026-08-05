-- CreateTable: moderator notes (replaces isInternal messages)
CREATE TABLE "report_moderator_notes" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentHtml" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_moderator_notes_pkey" PRIMARY KEY ("id")
);

-- Migrate internal messages → moderator notes
INSERT INTO "report_moderator_notes" ("id", "reportId", "authorId", "content", "contentHtml", "isPinned", "createdAt", "updatedAt")
SELECT
    replace(gen_random_uuid()::text, '-', ''),
    "reportId",
    "authorId",
    "content",
    "contentHtml",
    false,
    "createdAt",
    "createdAt"
FROM "report_messages"
WHERE "isInternal" = true;

-- Remove migrated internal messages from the public thread
DELETE FROM "report_messages" WHERE "isInternal" = true;

-- AlterTable: message soft-delete and pin fields
ALTER TABLE "report_messages"
    ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "deletedAt" TIMESTAMP(3),
    ADD COLUMN "deletedBy" TEXT,
    ADD COLUMN "deleteReason" TEXT,
    ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "pinnedAt" TIMESTAMP(3),
    ADD COLUMN "pinnedBy" TEXT;

ALTER TABLE "report_messages" DROP COLUMN "isInternal";

-- AlterTable: report archive fields
ALTER TABLE "reports"
    ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "archivedAt" TIMESTAMP(3),
    ADD COLUMN "archivedBy" TEXT,
    ADD COLUMN "archiveReason" TEXT;

-- CreateTable: TigerReports sync placeholder
CREATE TABLE "game_reports" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "reportedUsername" TEXT NOT NULL,
    "reporterUsername" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "server" TEXT NOT NULL,
    "moderatorNote" TEXT,
    "punishmentApplied" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable: LiteBans sync placeholder
CREATE TABLE "game_punishments" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "playerUsername" TEXT NOT NULL,
    "playerUuid" TEXT,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "duration" TEXT,
    "bannedBy" TEXT NOT NULL,
    "bannedByUuid" TEXT,
    "server" TEXT NOT NULL,
    "bannedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAppealable" BOOLEAN NOT NULL DEFAULT true,
    "removedAt" TIMESTAMP(3),
    "removedBy" TEXT,
    "removeReason" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_punishments_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "report_moderator_notes_reportId_idx" ON "report_moderator_notes"("reportId");

CREATE UNIQUE INDEX "game_reports_externalId_key" ON "game_reports"("externalId");
CREATE INDEX "game_reports_reportedUsername_idx" ON "game_reports"("reportedUsername");
CREATE INDEX "game_reports_reporterUsername_idx" ON "game_reports"("reporterUsername");
CREATE INDEX "game_reports_status_idx" ON "game_reports"("status");

CREATE UNIQUE INDEX "game_punishments_externalId_key" ON "game_punishments"("externalId");
CREATE INDEX "game_punishments_playerUsername_idx" ON "game_punishments"("playerUsername");
CREATE INDEX "game_punishments_playerUuid_idx" ON "game_punishments"("playerUuid");
CREATE INDEX "game_punishments_type_isActive_idx" ON "game_punishments"("type", "isActive");

-- ForeignKeys
ALTER TABLE "report_moderator_notes" ADD CONSTRAINT "report_moderator_notes_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "report_moderator_notes" ADD CONSTRAINT "report_moderator_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
