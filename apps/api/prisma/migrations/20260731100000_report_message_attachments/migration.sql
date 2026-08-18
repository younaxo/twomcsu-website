-- CreateTable
CREATE TABLE "report_message_attachments" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_message_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "report_message_attachments_messageId_idx" ON "report_message_attachments"("messageId");

-- AddForeignKey
ALTER TABLE "report_message_attachments" ADD CONSTRAINT "report_message_attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "report_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
