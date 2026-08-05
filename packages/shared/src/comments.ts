export const CommentPolicy = {
  EVERYONE: 'EVERYONE',
  FRIENDS: 'FRIENDS',
  FRIENDS_OF_FRIENDS: 'FRIENDS_OF_FRIENDS',
  NOBODY: 'NOBODY',
} as const;

export type CommentPolicy = (typeof CommentPolicy)[keyof typeof CommentPolicy];

export const CommentReportReason = {
  SPAM: 'SPAM',
  INAPPROPRIATE: 'INAPPROPRIATE',
  HARASSMENT: 'HARASSMENT',
  IMPERSONATION: 'IMPERSONATION',
  OTHER: 'OTHER',
} as const;

export type CommentReportReason =
  (typeof CommentReportReason)[keyof typeof CommentReportReason];

export const CommentReportStatus = {
  PENDING: 'PENDING',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',
} as const;

export type CommentReportStatus =
  (typeof CommentReportStatus)[keyof typeof CommentReportStatus];

export const CommentSort = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  POPULAR: 'popular',
} as const;

export type CommentSort = (typeof CommentSort)[keyof typeof CommentSort];

export const COMMENT_EMOJIS = [
  'thumbs_up',
  'heart',
  'laugh',
  'wow',
  'sad',
  'angry',
  'party',
  'fire',
] as const;

export type CommentEmoji = (typeof COMMENT_EMOJIS)[number];

export const COMMENT_EMOJI_LABELS: Record<CommentEmoji, string> = {
  thumbs_up: 'Нравится',
  heart: 'Сердце',
  laugh: 'Смех',
  wow: 'Вау',
  sad: 'Грусть',
  angry: 'Злость',
  party: 'Праздник',
  fire: 'Огонь',
};

export const COMMENT_EMOJI_CHARS: Record<CommentEmoji, string> = {
  thumbs_up: '👍',
  heart: '❤️',
  laugh: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😡',
  party: '🎉',
  fire: '🔥',
};

export const MAX_COMMENT_LENGTH = 2000;
export const MAX_COMMENT_PAGE_SIZE = 150;
export const MAX_PINNED_COMMENTS = 3;
export const COMMENT_EDIT_WINDOW_MS = 15 * 60 * 1000;

export interface CommentAuthor {
  id: string;
  username: string;
  avatar: string | null;
  position: import('./position').Position;
  badges: import('./profile').UserBadge[];
}

export interface CommentReactionSummary {
  emoji: CommentEmoji;
  count: number;
  reacted: boolean;
  users: Array<{ id: string; username: string }>;
}

export interface ProfileComment {
  id: string;
  profileId: string;
  author: CommentAuthor;
  content: string;
  contentHtml: string;
  parentId: string | null;
  isPinned: boolean;
  pinnedAt: string | null;
  pinnedBy: string | null;
  isEdited: boolean;
  editedAt: string | null;
  isDeleted: boolean;
  mentions: Array<{ id: string; username: string; position: import('./position').Position }>;
  createdAt: string;
  updatedAt: string;
  reactions: CommentReactionSummary[];
  replies: ProfileComment[];
  canEdit: boolean;
  canDelete: boolean;
  canPin: boolean;
}

export interface ProfileCommentsResponse {
  data: ProfileComment[];
  pinned: ProfileComment[];
  pagination: import('./api').PaginationMeta;
  commentsEnabled: boolean;
  commentsForcedReason: string | null;
  commentPolicy: CommentPolicy;
  canComment: boolean;
}

export interface CommentReport {
  id: string;
  reason: CommentReportReason;
  description: string | null;
  status: CommentReportStatus;
  reviewNote: string | null;
  createdAt: string;
  comment: {
    id: string;
    content: string;
    isDeleted: boolean;
    author: { id: string; username: string };
    profile: { id: string; username: string };
  };
  reporter: { id: string; username: string; position: import('./position').Position };
}
