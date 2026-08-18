-- AlterTable
ALTER TABLE "user_badges" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "user_awards" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "user_badges_userId_order_idx" ON "user_badges"("userId", "order");

-- CreateIndex
CREATE INDEX "user_awards_userId_order_idx" ON "user_awards"("userId", "order");
