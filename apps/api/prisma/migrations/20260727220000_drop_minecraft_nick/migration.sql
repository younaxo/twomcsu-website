-- Sync minecraftNick into username where username would be empty (safety)
UPDATE "users"
SET "username" = "minecraftNick"
WHERE ("username" IS NULL OR TRIM("username") = '')
  AND "minecraftNick" IS NOT NULL;

-- Drop unique constraint / indexes and column
DROP INDEX IF EXISTS "users_minecraftNick_key";
DROP INDEX IF EXISTS "users_minecraftNick_idx";
ALTER TABLE "users" DROP COLUMN IF EXISTS "minecraftNick";
