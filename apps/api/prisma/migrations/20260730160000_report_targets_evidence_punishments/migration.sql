-- CreateTable
CREATE TABLE "report_targets" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "userId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_evidence_links" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "type" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_evidence_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_punishments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "punishmentType" "PunishmentType" NOT NULL,
    "reason" TEXT NOT NULL,
    "duration" TEXT,
    "server" TEXT,
    "issuedBy" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAppealable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_punishments_pkey" PRIMARY KEY ("id")
);

-- Migrate single target → report_targets
INSERT INTO "report_targets" ("id", "reportId", "username", "userId", "order", "createdAt")
SELECT
  replace(gen_random_uuid()::text, '-', ''),
  r.id,
  r."targetUsername",
  r."targetUserId",
  0,
  r."createdAt"
FROM "reports" r
WHERE r."targetUsername" IS NOT NULL;

-- Migrate evidenceLinks[] → report_evidence_links
INSERT INTO "report_evidence_links" ("id", "reportId", "url", "title", "type", "order", "createdAt")
SELECT
  replace(gen_random_uuid()::text, '-', ''),
  r.id,
  link.url,
  NULL,
  CASE
    WHEN link.url ILIKE '%youtube.com%' OR link.url ILIKE '%youtu.be%' THEN 'youtube'
    WHEN link.url ILIKE '%twitch.tv%' THEN 'twitch'
    WHEN link.url ILIKE '%imgur.com%' THEN 'imgur'
    WHEN link.url ILIKE '%drive.google.com%' THEN 'google_drive'
    ELSE 'other'
  END,
  (link.ordinality - 1)::integer,
  r."createdAt"
FROM "reports" r
CROSS JOIN LATERAL unnest(r."evidenceLinks") WITH ORDINALITY AS link(url, ordinality)
WHERE cardinality(r."evidenceLinks") > 0;

-- AlterTable reports: add appeal FK, drop legacy columns
ALTER TABLE "reports" ADD COLUMN "appealedPunishmentId" TEXT;

ALTER TABLE "reports" DROP COLUMN "targetUsername";
ALTER TABLE "reports" DROP COLUMN "targetUserId";
ALTER TABLE "reports" DROP COLUMN "evidenceLinks";

-- Indexes
CREATE INDEX "report_targets_reportId_idx" ON "report_targets"("reportId");
CREATE INDEX "report_targets_userId_idx" ON "report_targets"("userId");
CREATE INDEX "report_targets_username_idx" ON "report_targets"("username");

CREATE INDEX "report_evidence_links_reportId_idx" ON "report_evidence_links"("reportId");

CREATE INDEX "user_punishments_userId_isActive_idx" ON "user_punishments"("userId", "isActive");
CREATE INDEX "user_punishments_issuedBy_idx" ON "user_punishments"("issuedBy");

CREATE INDEX "reports_appealedPunishmentId_idx" ON "reports"("appealedPunishmentId");

-- ForeignKeys
ALTER TABLE "report_targets" ADD CONSTRAINT "report_targets_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "report_targets" ADD CONSTRAINT "report_targets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "report_evidence_links" ADD CONSTRAINT "report_evidence_links_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_punishments" ADD CONSTRAINT "user_punishments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_punishments" ADD CONSTRAINT "user_punishments_issuedBy_fkey" FOREIGN KEY ("issuedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reports" ADD CONSTRAINT "reports_appealedPunishmentId_fkey" FOREIGN KEY ("appealedPunishmentId") REFERENCES "user_punishments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
