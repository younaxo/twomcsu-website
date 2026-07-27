-- User public ids
ALTER TABLE "users" ADD COLUMN "shortId" INTEGER;
ALTER TABLE "users" ADD COLUMN "tag" VARCHAR(32);
ALTER TABLE "users" ADD COLUMN "notifyOnFriendRequest" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "notifyOnGift" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "notifyOnOrder" BOOLEAN NOT NULL DEFAULT true;

-- Reserve 1 and 2 for KleekYT / younaxo_; existing rows start at 3
WITH numbered AS (
  SELECT id, (ROW_NUMBER() OVER (ORDER BY "createdAt" ASC)) + 2 AS n
  FROM "users"
)
UPDATE "users" u
SET "shortId" = numbered.n
FROM numbered
WHERE u.id = numbered.id;

UPDATE "users"
SET "tag" = lower(left(regexp_replace("username", '[^a-zA-Z0-9]', '', 'g') || 'user', 4))
  || '#'
  || substr(md5("id"), 1, 4)
WHERE "tag" IS NULL;

CREATE UNIQUE INDEX "users_shortId_key" ON "users"("shortId");
CREATE UNIQUE INDEX "users_tag_key" ON "users"("tag");
CREATE INDEX "users_tag_idx" ON "users"("tag");
CREATE INDEX "users_shortId_idx" ON "users"("shortId");

CREATE SEQUENCE "users_shortId_seq";
SELECT setval('"users_shortId_seq"', COALESCE((SELECT MAX("shortId") FROM "users"), 2));
ALTER TABLE "users" ALTER COLUMN "shortId" SET DEFAULT nextval('"users_shortId_seq"');
ALTER TABLE "users" ALTER COLUMN "shortId" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "tag" SET NOT NULL;
ALTER SEQUENCE "users_shortId_seq" OWNED BY "users"."shortId";

-- Guest checkout on orders
ALTER TABLE "orders" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "orders" ADD COLUMN "guestMinecraftNick" VARCHAR(16);

-- Notifications
CREATE TYPE "NotificationType" AS ENUM (
  'COMMENT_ON_PROFILE',
  'COMMENT_MENTION',
  'COMMENT_REPLY',
  'FRIEND_REQUEST',
  'FRIEND_ACCEPTED',
  'GIFT_RECEIVED',
  'ORDER_STATUS_CHANGED',
  'SYSTEM'
);

CREATE TABLE "notifications" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT,
  "link" TEXT,
  "imageUrl" TEXT,
  "fromUserId" TEXT,
  "metadata" JSONB,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_fromUserId_fkey"
  FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Display currencies
CREATE TABLE "currency_rates" (
  "id" TEXT NOT NULL,
  "currency" TEXT NOT NULL,
  "rate" DECIMAL(10,4) NOT NULL,
  "symbol" TEXT NOT NULL,
  "flag" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "currency_rates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "currency_rates_currency_key" ON "currency_rates"("currency");
