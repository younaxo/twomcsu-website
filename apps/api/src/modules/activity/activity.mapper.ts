import { Activity, ActivityFeedSettings, ActivityType, ActivityVisibility, Prisma } from '@prisma/client';
import {
  ActivityAuthor,
  ActivityCommentItem,
  ActivityDetail,
  ActivityEmoji,
  ActivityFeedSettings as SharedActivityFeedSettings,
  ActivityItem,
  ActivityReactionSummary,
  ActivityStats,
} from '@twomc/shared';
import { MinimalUserRow } from '../../common/prisma/user-selects';
import { toPublicPosition } from '../positions/position.mapper';
import { toUserBadge } from '../users/profile.mapper';

export type ActivityUserRow = MinimalUserRow;

export type ActivityReactionRow = {
  emoji: string;
  userId: string;
  user: { username: string; avatar: string | null };
};

export type ActivityWithRelations = Activity & {
  user: ActivityUserRow;
  reactions: ActivityReactionRow[];
  _count?: { comments: number; reactions: number };
  comments?: Array<{
    id: string;
    content: string;
    contentHtml: string | null;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    author: ActivityUserRow;
  }>;
};

export function toActivityAuthor(user: ActivityUserRow): ActivityAuthor {
  return {
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    shortId: user.shortId,
    roleGroup: user.roleGroup,
    position: toPublicPosition(user.position),
    badges: user.badges.filter((b) => b.isActive).map(toUserBadge),
  };
}

export function groupActivityReactions(
  reactions: ActivityReactionRow[],
  viewerId: string | null,
): ActivityReactionSummary[] {
  const map = new Map<string, ActivityReactionSummary>();

  for (const reaction of reactions) {
    const emoji = reaction.emoji as ActivityEmoji;
    const existing = map.get(emoji);
    if (existing) {
      existing.count += 1;
      if (existing.users.length < 8) {
        existing.users.push({
          username: reaction.user.username,
          avatar: reaction.user.avatar,
        });
      }
      if (viewerId && reaction.userId === viewerId) {
        existing.reactedByMe = true;
      }
    } else {
      map.set(emoji, {
        emoji,
        count: 1,
        reactedByMe: Boolean(viewerId && reaction.userId === viewerId),
        users: [
          {
            username: reaction.user.username,
            avatar: reaction.user.avatar,
          },
        ],
      });
    }
  }

  return [...map.values()].sort((a, b) => b.count - a.count);
}

export function toActivityItem(
  row: ActivityWithRelations,
  viewerId: string | null,
): ActivityItem {
  const commentsCount =
    row._count?.comments ??
    row.comments?.filter((c) => !c.isDeleted).length ??
    0;
  const reactionsCount = row._count?.reactions ?? row.reactions.length;

  return {
    id: row.id,
    type: row.type as ActivityItem['type'],
    visibility: row.visibility as ActivityItem['visibility'],
    title: row.title,
    description: row.description,
    imageUrl: row.imageUrl,
    actionUrl: row.actionUrl,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    isPinned: row.isPinned,
    createdAt: row.createdAt.toISOString(),
    user: toActivityAuthor(row.user),
    reactions: groupActivityReactions(row.reactions, viewerId),
    commentsCount,
    reactionsCount,
  };
}

export function toActivityDetail(
  row: ActivityWithRelations,
  viewerId: string | null,
): ActivityDetail {
  return {
    ...toActivityItem(row, viewerId),
    comments: (row.comments ?? [])
      .filter((c) => !c.isDeleted)
      .map(
        (c): ActivityCommentItem => ({
          id: c.id,
          content: c.content,
          contentHtml: c.contentHtml,
          isDeleted: c.isDeleted,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
          author: toActivityAuthor(c.author),
        }),
      ),
  };
}

export function toActivitySettings(
  row: ActivityFeedSettings,
): SharedActivityFeedSettings {
  return {
    showPurchases: row.showPurchases,
    showAchievements: row.showAchievements,
    showBadges: row.showBadges,
    showAwards: row.showAwards,
    showGifts: row.showGifts,
    showFriendships: row.showFriendships,
    showProfileUpdates: row.showProfileUpdates,
    showMilestones: row.showMilestones,
    showServerActivity: row.showServerActivity,
    purchasesVisibility: row.purchasesVisibility as ActivityVisibility,
    achievementsVisibility: row.achievementsVisibility as ActivityVisibility,
    badgesVisibility: row.badgesVisibility as ActivityVisibility,
    giftsVisibility: row.giftsVisibility as ActivityVisibility,
    friendshipsVisibility: row.friendshipsVisibility as ActivityVisibility,
    profileUpdatesVisibility: row.profileUpdatesVisibility as ActivityVisibility,
    notifyOnComment: row.notifyOnComment,
    notifyOnReaction: row.notifyOnReaction,
  };
}

export function buildActivityStats(input: {
  total: number;
  hiddenCount: number;
  pinnedCount: number;
  reactionsCount: number;
  commentsCount: number;
  byType: Array<{ type: ActivityType; _count: { _all: number } }>;
  topUsers: Array<{ userId: string; _count: { _all: number }; user?: { username: string } }>;
}): ActivityStats {
  return {
    total: input.total,
    hiddenCount: input.hiddenCount,
    pinnedCount: input.pinnedCount,
    reactionsCount: input.reactionsCount,
    commentsCount: input.commentsCount,
    byType: input.byType.map((row) => ({
      type: row.type as ActivityStats['byType'][number]['type'],
      count: row._count._all,
    })),
    topUsers: input.topUsers.map((row) => ({
      userId: row.userId,
      username: row.user?.username ?? row.userId,
      count: row._count._all,
    })),
  };
}

export type CreateActivityInput = {
  userId: string;
  type: ActivityType;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  actionUrl?: string | null;
  metadata?: Prisma.InputJsonValue;
  visibility?: ActivityVisibility;
  isPinned?: boolean;
};
