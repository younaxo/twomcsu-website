-- Deduplicate: keep the newest reaction per (commentId, userId)
DELETE FROM "comment_reactions" a
USING "comment_reactions" b
WHERE a."commentId" = b."commentId"
  AND a."userId" = b."userId"
  AND a."createdAt" < b."createdAt";

-- Drop old unique (commentId, userId, emoji)
DROP INDEX IF EXISTS "comment_reactions_commentId_userId_emoji_key";

-- One reaction per user per comment
CREATE UNIQUE INDEX "comment_reactions_commentId_userId_key" ON "comment_reactions"("commentId", "userId");
