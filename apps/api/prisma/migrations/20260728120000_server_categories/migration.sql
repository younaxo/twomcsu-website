-- CreateTable
CREATE TABLE "server_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "server_categories_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "servers" ADD COLUMN "categoryId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "server_categories_slug_key" ON "server_categories"("slug");

-- CreateIndex
CREATE INDEX "server_categories_slug_idx" ON "server_categories"("slug");

-- CreateIndex
CREATE INDEX "server_categories_isActive_order_idx" ON "server_categories"("isActive", "order");

-- CreateIndex
CREATE INDEX "servers_categoryId_idx" ON "servers"("categoryId");

-- AddForeignKey
ALTER TABLE "servers" ADD CONSTRAINT "servers_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "server_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
