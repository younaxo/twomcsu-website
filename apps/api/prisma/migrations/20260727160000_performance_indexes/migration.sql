-- CreateIndex
CREATE INDEX "users_roleGroup_isBanned_idx" ON "users"("roleGroup", "isBanned");

-- CreateIndex
CREATE INDEX "users_lastLoginAt_idx" ON "users"("lastLoginAt");

-- CreateIndex
CREATE INDEX "profile_views_profileId_viewedAt_idx" ON "profile_views"("profileId", "viewedAt");

-- CreateIndex
CREATE INDEX "friendships_addresseeId_status_idx" ON "friendships"("addresseeId", "status");

-- CreateIndex
CREATE INDEX "friendships_requesterId_status_idx" ON "friendships"("requesterId", "status");
