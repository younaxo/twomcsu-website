-- CreateTable
CREATE TABLE "positions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "group" "RoleGroup" NOT NULL,
    "color" VARCHAR(7) NOT NULL,
    "backgroundColor" VARCHAR(9),
    "icon" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "positions_name_key" ON "positions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "positions_slug_key" ON "positions"("slug");

-- CreateIndex
CREATE INDEX "positions_slug_idx" ON "positions"("slug");

-- CreateIndex
CREATE INDEX "positions_group_idx" ON "positions"("group");

-- CreateIndex
CREATE INDEX "positions_priority_idx" ON "positions"("priority");

-- Default position of every group, the seed picks these rows up by slug later
INSERT INTO "positions" ("id", "name", "slug", "displayName", "group", "color", "priority", "isDefault", "updatedAt")
VALUES
    (gen_random_uuid()::text, 'Owner', 'owner', 'Owner', 'OWNER', '#FFD700', 100, true, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'Special Administrator', 'special-administrator', 'Special Administrator', 'ADMIN', '#FF4444', 90, true, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'Head Cheat Hunter', 'head-cheat-hunter', 'Head Cheat Hunter', 'MODERATOR', '#16A085', 80, true, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'Chief Helper', 'chief-helper', 'Chief Helper', 'HELPER', '#00BCD4', 60, true, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'Default', 'default', 'Default', 'PLAYER', '#95A5A6', 0, true, CURRENT_TIMESTAMP);

-- AlterTable
ALTER TABLE "users" ADD COLUMN "positionId" TEXT;

-- Existing users land on the default position of their current role group
UPDATE "users" AS u
SET "positionId" = p."id"
FROM "positions" AS p
WHERE p."group" = u."roleGroup" AND p."isDefault";

ALTER TABLE "users" ALTER COLUMN "positionId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "users_positionId_idx" ON "users"("positionId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
