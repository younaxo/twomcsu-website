import { News, NewsCategory, NewsStatus, Prisma } from '@prisma/client';
import {
  NewsAdminItem,
  NewsAuthor,
  NewsComment,
  NewsCommentReactionSummary,
  NewsDetails,
  NewsSummary,
  CommentEmoji,
} from '@twomc/shared';
import { MinimalUserRow } from '../../common/prisma/user-selects';
import { toPublicPosition } from '../positions/position.mapper';
import { toUserBadge } from '../users/profile.mapper';

export type NewsAuthorRow = MinimalUserRow;

export type NewsWithAuthor = News & {
  author: NewsAuthorRow;
  tags?: Array<{ tag: string }>;
};

export function toNewsAuthor(user: NewsAuthorRow): NewsAuthor {
  return {
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    position: toPublicPosition(user.position),
    badges: user.badges.filter((b) => b.isActive).map(toUserBadge),
  };
}

export function toNewsSummary(
  row: NewsWithAuthor,
  likedByMe?: boolean,
): NewsSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverImage: row.coverImage,
    category: row.category as NewsSummary['category'],
    author: toNewsAuthor(row.author),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    viewsCount: row.viewsCount,
    likesCount: row.likesCount,
    commentsCount: row.commentsCount,
    isPinned: row.isPinned,
    isFeatured: row.isFeatured,
    ...(likedByMe !== undefined ? { likedByMe } : {}),
  };
}

export function toNewsDetails(
  row: NewsWithAuthor,
  likedByMe?: boolean,
): NewsDetails {
  return {
    ...toNewsSummary(row, likedByMe),
    content: row.content,
    contentHtml: row.contentHtml,
    status: row.status as NewsDetails['status'],
    tags: (row.tags ?? []).map((t) => t.tag),
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    metaKeywords: row.metaKeywords,
    ogImage: row.ogImage,
    allowComments: row.allowComments,
    scheduledFor: row.scheduledFor?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toNewsAdminItem(row: NewsWithAuthor): NewsAdminItem {
  return {
    ...toNewsDetails(row),
    authorId: row.authorId,
  };
}

type ReactionRow = {
  emoji: string;
  userId: string;
  user: { id: string; username: string };
};

export function groupNewsReactions(
  reactions: ReactionRow[],
  viewerId: string | null,
): NewsCommentReactionSummary[] {
  const map = new Map<string, NewsCommentReactionSummary>();

  for (const reaction of reactions) {
    const emoji = reaction.emoji as CommentEmoji;
    const existing = map.get(emoji);
    if (existing) {
      existing.count += 1;
      existing.users.push({ id: reaction.user.id, username: reaction.user.username });
      if (viewerId && reaction.userId === viewerId) {
        existing.reacted = true;
      }
    } else {
      map.set(emoji, {
        emoji,
        count: 1,
        reacted: Boolean(viewerId && reaction.userId === viewerId),
        users: [{ id: reaction.user.id, username: reaction.user.username }],
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export type NewsCommentRow = Prisma.NewsCommentGetPayload<{
  include: {
    author: { select: typeof import('../../common/prisma/user-selects').selectMinimalUser };
    reactions: { include: { user: { select: { id: true; username: true } } } };
    replies: {
      include: {
        author: { select: typeof import('../../common/prisma/user-selects').selectMinimalUser };
        reactions: { include: { user: { select: { id: true; username: true } } } };
      };
    };
  };
}>;

export function toNewsComment(
  row: {
    id: string;
    newsId: string;
    content: string;
    contentHtml: string | null;
    parentId: string | null;
    isPinned: boolean;
    isDeleted: boolean;
    isEdited: boolean;
    editedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    authorId: string;
    author: NewsAuthorRow;
    reactions: ReactionRow[];
    replies?: Array<{
      id: string;
      newsId: string;
      content: string;
      contentHtml: string | null;
      parentId: string | null;
      isPinned: boolean;
      isDeleted: boolean;
      isEdited: boolean;
      editedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      authorId: string;
      author: NewsAuthorRow;
      reactions: ReactionRow[];
    }>;
  },
  viewerId: string | null,
  canModerate: boolean,
): NewsComment {
  const canEdit =
    Boolean(viewerId) &&
    row.authorId === viewerId &&
    !row.isDeleted &&
    Date.now() - row.createdAt.getTime() <= 15 * 60 * 1000;

  const canDelete =
    Boolean(viewerId) && (row.authorId === viewerId || canModerate) && !row.isDeleted;

  return {
    id: row.id,
    newsId: row.newsId,
    author: {
      id: row.author.id,
      username: row.author.username,
      avatar: row.author.avatar,
      position: toPublicPosition(row.author.position),
      badges: row.author.badges.filter((b) => b.isActive).map(toUserBadge),
    },
    content: row.isDeleted ? '' : row.content,
    contentHtml: row.isDeleted ? '<p>Комментарий удалён</p>' : row.contentHtml,
    parentId: row.parentId,
    isPinned: row.isPinned,
    isDeleted: row.isDeleted,
    isEdited: row.isEdited,
    editedAt: row.editedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    reactions: groupNewsReactions(row.reactions, viewerId),
    replies: (row.replies ?? []).map((reply) =>
      toNewsComment(reply, viewerId, canModerate),
    ),
    canEdit,
    canDelete,
  };
}

export type { NewsCategory, NewsStatus };
