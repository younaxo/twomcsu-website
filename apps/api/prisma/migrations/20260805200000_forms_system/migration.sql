-- CreateEnum
CREATE TYPE "FormFieldType" AS ENUM (
  'TEXT',
  'TEXTAREA',
  'RADIO',
  'CHECKBOX',
  'SELECT',
  'NUMBER',
  'DATE',
  'TIME',
  'EMAIL',
  'PHONE',
  'URL',
  'FILE_UPLOAD',
  'RATING',
  'COLOR_PICKER',
  'CODE_EDITOR',
  'MARKDOWN_EDITOR',
  'IMAGE_GALLERY',
  'VIDEO_URL',
  'SCHEDULE_PICKER',
  'AGREEMENT_CHECKLIST',
  'PLAYER_SELECTOR',
  'SERVER_SELECTOR',
  'RANK_SELECTOR',
  'FRIENDS_SELECTOR',
  'PRODUCT_SELECTOR',
  'ORDER_SELECTOR',
  'REPORT_REFERENCE',
  'NEWS_REFERENCE',
  'TOPIC_REFERENCE',
  'PUNISHMENT_REFERENCE',
  'SIGNATURE',
  'DATE_RANGE',
  'CURRENCY_AMOUNT',
  'STATS_DISPLAY',
  'ACHIEVEMENT_SELECTOR'
);

-- CreateEnum
CREATE TYPE "FormVisibility" AS ENUM (
  'PUBLIC',
  'AUTHENTICATED',
  'HELPER_ONLY',
  'MODERATOR_ONLY',
  'ADMIN_ONLY',
  'OWNER_ONLY',
  'INVITE_ONLY'
);

-- CreateEnum
CREATE TYPE "FormStatus" AS ENUM (
  'DRAFT',
  'PUBLISHED',
  'CLOSED',
  'ARCHIVED'
);

-- CreateTable
CREATE TABLE "forms" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "descriptionHtml" TEXT,
    "coverImage" TEXT,
    "status" "FormStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "FormVisibility" NOT NULL DEFAULT 'PUBLIC',
    "createdById" TEXT NOT NULL,
    "maxResponses" INTEGER,
    "responsesCount" INTEGER NOT NULL DEFAULT 0,
    "onePerUser" BOOLEAN NOT NULL DEFAULT true,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "showResults" BOOLEAN NOT NULL DEFAULT false,
    "requiresAuth" BOOLEAN NOT NULL DEFAULT false,
    "requiresCaptcha" BOOLEAN NOT NULL DEFAULT true,
    "opensAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "timeLimit" INTEGER,
    "multiStep" BOOLEAN NOT NULL DEFAULT false,
    "stepsConfig" JSONB,
    "customCss" TEXT,
    "thankYouMessage" TEXT,
    "redirectUrl" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_fields" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "type" "FormFieldType" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "placeholder" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "stepIndex" INTEGER,
    "options" JSONB,
    "validation" JSONB,
    "conditionalLogic" JSONB,
    "defaultValue" TEXT,
    "minValue" INTEGER,
    "maxValue" INTEGER,
    "minLength" INTEGER,
    "maxLength" INTEGER,
    "maxFiles" INTEGER,
    "maxFileSize" INTEGER,
    "allowedMimes" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_responses" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "respondentId" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_field_answers" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "textValue" TEXT,
    "numberValue" DECIMAL(12,2),
    "booleanValue" BOOLEAN,
    "dateValue" TIMESTAMP(3),
    "jsonValue" JSONB,
    "fileUrls" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_field_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_invites" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "forms_slug_key" ON "forms"("slug");

-- CreateIndex
CREATE INDEX "forms_slug_idx" ON "forms"("slug");

-- CreateIndex
CREATE INDEX "forms_status_visibility_idx" ON "forms"("status", "visibility");

-- CreateIndex
CREATE INDEX "forms_createdById_idx" ON "forms"("createdById");

-- CreateIndex
CREATE INDEX "form_fields_formId_order_idx" ON "form_fields"("formId", "order");

-- CreateIndex
CREATE INDEX "form_responses_formId_respondentId_idx" ON "form_responses"("formId", "respondentId");

-- CreateIndex
CREATE INDEX "form_responses_formId_isComplete_idx" ON "form_responses"("formId", "isComplete");

-- CreateIndex
CREATE INDEX "form_field_answers_responseId_idx" ON "form_field_answers"("responseId");

-- CreateIndex
CREATE INDEX "form_field_answers_fieldId_idx" ON "form_field_answers"("fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "form_invites_code_key" ON "form_invites"("code");

-- CreateIndex
CREATE INDEX "form_invites_code_idx" ON "form_invites"("code");

-- CreateIndex
CREATE INDEX "form_invites_formId_idx" ON "form_invites"("formId");

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_field_answers" ADD CONSTRAINT "form_field_answers_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "form_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_field_answers" ADD CONSTRAINT "form_field_answers_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "form_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_invites" ADD CONSTRAINT "form_invites_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
