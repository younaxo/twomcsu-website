-- CreateEnum
CREATE TYPE "DecorationAvailability" AS ENUM ('STORE', 'ADMIN_ONLY', 'UNAVAILABLE');
CREATE TYPE "DecorationGrantSource" AS ENUM ('PURCHASE', 'ADMIN', 'LEGACY');
CREATE TYPE "CalendarEventCategory" AS ENUM ('COMMUNITY', 'TOURNAMENT', 'UPDATE', 'MAINTENANCE', 'HOLIDAY', 'OTHER');
CREATE TYPE "CalendarEventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');
CREATE TYPE "CalendarEventVisibility" AS ENUM ('PUBLIC', 'AUTHENTICATED', 'STAFF');
CREATE TYPE "EventAttendanceStatus" AS ENUM ('GOING', 'INTERESTED', 'DECLINED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'EVENT_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE 'EVENT_UPDATED';
ALTER TYPE "NotificationType" ADD VALUE 'DECORATION_GRANTED';

-- CreateTable
CREATE TABLE "profile_decorations" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "availability" "DecorationAvailability" NOT NULL DEFAULT 'UNAVAILABLE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "profile_decorations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_decorations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "decorationId" TEXT NOT NULL,
    "source" "DecorationGrantSource" NOT NULL,
    "grantedById" TEXT,
    "orderId" TEXT,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_decorations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL,
    "descriptionHtml" TEXT NOT NULL,
    "coverImage" TEXT,
    "category" "CalendarEventCategory" NOT NULL,
    "status" "CalendarEventStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "CalendarEventVisibility" NOT NULL DEFAULT 'PUBLIC',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'Europe/Moscow',
    "location" VARCHAR(160),
    "server" VARCHAR(100),
    "maxParticipants" INTEGER,
    "registrationDeadline" TIMESTAMP(3),
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "event_participants" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "EventAttendanceStatus" NOT NULL DEFAULT 'GOING',
    "remindedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "event_participants_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "users" ADD COLUMN "selectedDecorationId" TEXT;
ALTER TABLE "products" ADD COLUMN "decorationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "profile_decorations_slug_key" ON "profile_decorations"("slug");
CREATE INDEX "profile_decorations_availability_isActive_idx" ON "profile_decorations"("availability", "isActive");
CREATE INDEX "profile_decorations_order_idx" ON "profile_decorations"("order");
CREATE UNIQUE INDEX "user_decorations_userId_decorationId_key" ON "user_decorations"("userId", "decorationId");
CREATE INDEX "user_decorations_userId_acquiredAt_idx" ON "user_decorations"("userId", "acquiredAt");
CREATE INDEX "user_decorations_decorationId_idx" ON "user_decorations"("decorationId");
CREATE INDEX "user_decorations_grantedById_idx" ON "user_decorations"("grantedById");
CREATE UNIQUE INDEX "calendar_events_slug_key" ON "calendar_events"("slug");
CREATE INDEX "calendar_events_status_startsAt_idx" ON "calendar_events"("status", "startsAt");
CREATE INDEX "calendar_events_visibility_startsAt_idx" ON "calendar_events"("visibility", "startsAt");
CREATE INDEX "calendar_events_category_startsAt_idx" ON "calendar_events"("category", "startsAt");
CREATE INDEX "calendar_events_createdById_idx" ON "calendar_events"("createdById");
CREATE UNIQUE INDEX "event_participants_eventId_userId_key" ON "event_participants"("eventId", "userId");
CREATE INDEX "event_participants_eventId_status_idx" ON "event_participants"("eventId", "status");
CREATE INDEX "event_participants_userId_status_idx" ON "event_participants"("userId", "status");
CREATE INDEX "users_selectedDecorationId_idx" ON "users"("selectedDecorationId");
CREATE UNIQUE INDEX "products_decorationId_key" ON "products"("decorationId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_selectedDecorationId_fkey" FOREIGN KEY ("selectedDecorationId") REFERENCES "profile_decorations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_decorationId_fkey" FOREIGN KEY ("decorationId") REFERENCES "profile_decorations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_decorations" ADD CONSTRAINT "user_decorations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_decorations" ADD CONSTRAINT "user_decorations_decorationId_fkey" FOREIGN KEY ("decorationId") REFERENCES "profile_decorations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_decorations" ADD CONSTRAINT "user_decorations_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed decorations
INSERT INTO "profile_decorations" ("id", "slug", "name", "imageUrl", "availability", "order", "updatedAt") VALUES
('decoration-sakura', 'blooming-sakura', 'Цветущая сакура', 'https://cdn-files.twomc.su/assets/images/profile-assets/1.png', 'STORE', 1, CURRENT_TIMESTAMP),
('decoration-cute-cat', 'cute-cat', 'Милый котик', 'https://cdn-files.twomc.su/assets/images/profile-assets/2.png', 'STORE', 2, CURRENT_TIMESTAMP),
('decoration-white-star', 'white-star', 'Белая звёздочка', 'https://cdn-files.twomc.su/assets/images/profile-assets/3.png', 'STORE', 3, CURRENT_TIMESTAMP),
('decoration-pumpkin', 'pumpkin', 'Тыковка', 'https://cdn-files.twomc.su/assets/images/profile-assets/4.png', 'UNAVAILABLE', 4, CURRENT_TIMESTAMP),
('decoration-farmer-hat', 'farmer-hat', 'Фермерская шляпка', 'https://cdn-files.twomc.su/assets/images/profile-assets/5.png', 'STORE', 5, CURRENT_TIMESTAMP),
('decoration-kind-hearts', 'kind-hearts', 'Добрые сердечки', 'https://cdn-files.twomc.su/assets/images/profile-assets/6.png', 'STORE', 6, CURRENT_TIMESTAMP),
('decoration-naruto', 'naruto', 'Наруто', 'https://cdn-files.twomc.su/assets/images/profile-assets/7.png', 'STORE', 7, CURRENT_TIMESTAMP),
('decoration-neon-halloween', 'neon-halloween', 'Неоновый хэллоуин', 'https://cdn-files.twomc.su/assets/images/profile-assets/9.png', 'UNAVAILABLE', 8, CURRENT_TIMESTAMP),
('decoration-sinister-mask', 'sinister-mask', 'Зловещая маска', 'https://cdn-files.twomc.su/assets/images/profile-assets/10.png', 'STORE', 9, CURRENT_TIMESTAMP),
('decoration-champagne', 'new-year-champagne', 'Новогоднее шампанское', 'https://cdn-files.twomc.su/assets/images/profile-assets/11.png', 'UNAVAILABLE', 10, CURRENT_TIMESTAMP),
('decoration-snowflakes', 'cold-snowflakes', 'Холодные снежинки', 'https://cdn-files.twomc.su/assets/images/profile-assets/12.png', 'UNAVAILABLE', 11, CURRENT_TIMESTAMP),
('decoration-new-year', 'happy-new-year', 'С новым годом!', 'https://cdn-files.twomc.su/assets/images/profile-assets/13.png', 'UNAVAILABLE', 12, CURRENT_TIMESTAMP),
('decoration-glowing-hearts', 'glowing-hearts', 'Светящиеся сердечки', 'https://cdn-files.twomc.su/assets/images/profile-assets/14.png', 'STORE', 13, CURRENT_TIMESTAMP),
('decoration-i-love-me', 'i-love-me', 'I Love Me', 'https://cdn-files.twomc.su/assets/images/profile-assets/15.png', 'UNAVAILABLE', 14, CURRENT_TIMESTAMP),
('decoration-i-love-him', 'i-love-him', 'I Love Him', 'https://cdn-files.twomc.su/assets/images/profile-assets/16.png', 'UNAVAILABLE', 15, CURRENT_TIMESTAMP),
('decoration-i-love-her', 'i-love-her', 'I Love Her', 'https://cdn-files.twomc.su/assets/images/profile-assets/17.png', 'UNAVAILABLE', 16, CURRENT_TIMESTAMP),
('decoration-heart-left', 'heart-left', 'Сердечко (левое)', 'https://cdn-files.twomc.su/assets/images/profile-assets/18.png', 'UNAVAILABLE', 17, CURRENT_TIMESTAMP),
('decoration-heart-right', 'heart-right', 'Сердечко (правое)', 'https://cdn-files.twomc.su/assets/images/profile-assets/19.png', 'UNAVAILABLE', 18, CURRENT_TIMESTAMP),
('decoration-night-stars', 'night-stars', 'Ночные звезды', 'https://cdn-files.twomc.su/assets/images/profile-assets/20.png', 'ADMIN_ONLY', 19, CURRENT_TIMESTAMP),
('decoration-angel', 'angel', 'Ангелок', 'https://cdn-files.twomc.su/assets/images/profile-assets/21.png', 'ADMIN_ONLY', 20, CURRENT_TIMESTAMP);
