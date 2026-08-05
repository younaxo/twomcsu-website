-- AlterEnum
ALTER TYPE "UserBadgeType" ADD VALUE 'LEADERSHIP';

-- Backfill PROJECT_TEAM for HELPER+ staff
INSERT INTO "user_badges" ("id", "userId", "type", "grantedAt", "isActive")
SELECT
  md5(random()::text || clock_timestamp()::text || u."id"),
  u."id",
  'PROJECT_TEAM'::"UserBadgeType",
  NOW(),
  true
FROM "users" u
WHERE u."roleGroup" IN ('HELPER', 'MODERATOR', 'ADMIN', 'OWNER')
  AND NOT EXISTS (
    SELECT 1 FROM "user_badges" b
    WHERE b."userId" = u."id" AND b."type" = 'PROJECT_TEAM'::"UserBadgeType"
  );
