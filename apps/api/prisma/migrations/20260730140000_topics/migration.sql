-- CreateEnum
CREATE TYPE "TopicCategory" AS ENUM ('RULES', 'DOCUMENTS', 'INFORMATION', 'ADMIN_INTERNAL', 'FAQ', 'ANNOUNCEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "TopicVisibility" AS ENUM ('PUBLIC', 'AUTHENTICATED', 'HELPER_ONLY', 'MODERATOR_ONLY', 'ADMIN_ONLY', 'OWNER_ONLY');

-- CreateTable
CREATE TABLE "topics" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "TopicCategory" NOT NULL,
    "visibility" "TopicVisibility" NOT NULL DEFAULT 'PUBLIC',
    "icon" TEXT,
    "color" TEXT,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "contentHtml" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topic_attachments" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topic_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "topics_slug_key" ON "topics"("slug");

-- CreateIndex
CREATE INDEX "topics_slug_idx" ON "topics"("slug");

-- CreateIndex
CREATE INDEX "topics_category_visibility_idx" ON "topics"("category", "visibility");

-- CreateIndex
CREATE INDEX "topics_isActive_isPinned_order_idx" ON "topics"("isActive", "isPinned", "order");

-- CreateIndex
CREATE INDEX "topic_attachments_topicId_idx" ON "topic_attachments"("topicId");

-- AddForeignKey
ALTER TABLE "topic_attachments" ADD CONSTRAINT "topic_attachments_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
