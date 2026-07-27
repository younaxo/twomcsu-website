-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('EVERYONE', 'FRIENDS_ONLY', 'NOBODY');

-- CreateEnum
CREATE TYPE "FriendRequestPolicy" AS ENUM ('EVERYONE', 'FRIENDS_OF_FRIENDS', 'NOBODY');

-- AlterTable: add new columns with defaults
ALTER TABLE "users" ADD COLUMN "profileVisibility" "ProfileVisibility" NOT NULL DEFAULT 'EVERYONE';
ALTER TABLE "users" ADD COLUMN "friendRequestPolicy" "FriendRequestPolicy" NOT NULL DEFAULT 'EVERYONE';

-- Data migration from the old boolean flag
UPDATE "users"
SET "profileVisibility" = 'NOBODY'
WHERE "isProfilePrivate" = true;

UPDATE "users"
SET "profileVisibility" = 'EVERYONE'
WHERE "isProfilePrivate" = false;

-- Drop the legacy column
ALTER TABLE "users" DROP COLUMN "isProfilePrivate";
