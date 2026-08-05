-- AlterTable
ALTER TABLE "users" DROP COLUMN IF EXISTS "hideInventory",
DROP COLUMN IF EXISTS "hideServices",
DROP COLUMN IF EXISTS "hideComments";
