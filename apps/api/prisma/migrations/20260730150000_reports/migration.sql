-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('PLAYER_COMPLAINT', 'ADMIN_COMPLAINT', 'PUNISHMENT_APPEAL', 'TECHNICAL_ISSUE', 'DONATION_PROBLEM', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'WAITING_RESPONSE', 'RESOLVED', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "PunishmentType" AS ENUM ('WARN', 'MUTE', 'KICK', 'TEMPBAN', 'PERMBAN');

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "authorId" TEXT NOT NULL,
    "targetUsername" TEXT,
    "targetUserId" TEXT,
    "server" TEXT,
    "incidentDate" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "descriptionHtml" TEXT,
    "evidenceLinks" TEXT[],
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "paymentDate" TIMESTAMP(3),
    "additionalText" TEXT,
    "assignedToId" TEXT,
    "verdict" TEXT,
    "verdictHtml" TEXT,
    "internalNote" TEXT,
    "punishmentType" "PunishmentType",
    "punishmentDuration" TEXT,
    "punishmentReason" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedBy" TEXT,
    "lockedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_messages" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentHtml" TEXT,
    "isStaff" BOOLEAN NOT NULL DEFAULT false,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_attachments" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_bans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "bannedBy" TEXT NOT NULL,
    "bannedUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_bans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reports_reportNumber_key" ON "reports"("reportNumber");

-- CreateIndex
CREATE INDEX "reports_authorId_idx" ON "reports"("authorId");

-- CreateIndex
CREATE INDEX "reports_type_status_idx" ON "reports"("type", "status");

-- CreateIndex
CREATE INDEX "reports_reportNumber_idx" ON "reports"("reportNumber");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "reports_assignedToId_idx" ON "reports"("assignedToId");

-- CreateIndex
CREATE INDEX "report_messages_reportId_createdAt_idx" ON "report_messages"("reportId", "createdAt");

-- CreateIndex
CREATE INDEX "report_attachments_reportId_idx" ON "report_attachments"("reportId");

-- CreateIndex
CREATE INDEX "report_bans_userId_isActive_idx" ON "report_bans"("userId", "isActive");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_messages" ADD CONSTRAINT "report_messages_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_messages" ADD CONSTRAINT "report_messages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_attachments" ADD CONSTRAINT "report_attachments_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_bans" ADD CONSTRAINT "report_bans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
