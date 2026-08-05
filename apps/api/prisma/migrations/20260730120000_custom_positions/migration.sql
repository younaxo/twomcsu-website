-- CreateTable
CREATE TABLE "custom_positions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_custom_positions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customPositionId" TEXT NOT NULL,
    "assignedBy" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_custom_positions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_positions_slug_key" ON "custom_positions"("slug");

-- CreateIndex
CREATE INDEX "custom_positions_slug_idx" ON "custom_positions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "user_custom_positions_userId_key" ON "user_custom_positions"("userId");

-- CreateIndex
CREATE INDEX "user_custom_positions_userId_idx" ON "user_custom_positions"("userId");

-- CreateIndex
CREATE INDEX "user_custom_positions_customPositionId_idx" ON "user_custom_positions"("customPositionId");

-- AddForeignKey
ALTER TABLE "user_custom_positions" ADD CONSTRAINT "user_custom_positions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_custom_positions" ADD CONSTRAINT "user_custom_positions_customPositionId_fkey" FOREIGN KEY ("customPositionId") REFERENCES "custom_positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
