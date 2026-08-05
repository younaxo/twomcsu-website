export const NewsCategory = {
  UPDATE: 'UPDATE',
  EVENT: 'EVENT',
  GUIDE: 'GUIDE',
  ANNOUNCEMENT: 'ANNOUNCEMENT',
  PATCH_NOTES: 'PATCH_NOTES',
  COMMUNITY: 'COMMUNITY',
  OTHER: 'OTHER',
} as const;

export type NewsCategory = (typeof NewsCategory)[keyof typeof NewsCategory];

export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  UPDATE: 'Обновления',
  EVENT: 'Ивенты',
  GUIDE: 'Гайды',
  ANNOUNCEMENT: 'Объявления',
  PATCH_NOTES: 'Патч-ноты',
  COMMUNITY: 'Комьюнити',
  OTHER: 'Другое',
};

export const NEWS_CATEGORY_COLORS: Record<NewsCategory, string> = {
  UPDATE: '#3B82F6',
  EVENT: '#8B5CF6',
  GUIDE: '#10B981',
  ANNOUNCEMENT: '#F57C00',
  PATCH_NOTES: '#F59E0B',
  COMMUNITY: '#EC4899',
  OTHER: '#6B7280',
};

export const NewsStatus = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type NewsStatus = (typeof NewsStatus)[keyof typeof NewsStatus];

export const NEWS_STATUS_LABELS: Record<NewsStatus, string> = {
  DRAFT: 'Черновик',
  SCHEDULED: 'Запланировано',
  PUBLISHED: 'Опубликовано',
  ARCHIVED: 'В архиве',
};

export const NewsSort = {
  NEWEST: 'newest',
  POPULAR: 'popular',
  MOST_LIKED: 'most_liked',
  MOST_COMMENTED: 'most_commented',
} as const;

export type NewsSort = (typeof NewsSort)[keyof typeof NewsSort];

export const NEWS_SORT_LABELS: Record<NewsSort, string> = {
  newest: 'Новые',
  popular: 'Популярные',
  most_liked: 'По лайкам',
  most_commented: 'По комментариям',
};

export const NewsCommentSort = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  MOST_LIKED: 'most_liked',
} as const;

export type NewsCommentSort = (typeof NewsCommentSort)[keyof typeof NewsCommentSort];

export const MAX_NEWS_EXCERPT_LENGTH = 300;
export const MAX_NEWS_COMMENT_LENGTH = 2000;
export const MIN_NEWS_COMMENT_LENGTH = 3;
export const NEWS_COMMENT_EDIT_WINDOW_MS = 15 * 60 * 1000;
export const NEWS_VIEW_DEDUP_HOURS = 24;

export interface NewsAuthor {
  id: string;
  username: string;
  avatar: string | null;
  position: import('./position').Position;
  badges?: import('./profile').UserBadge[];
}

export interface NewsTagItem {
  tag: string;
}

export interface NewsSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  category: NewsCategory;
  author: NewsAuthor;
  publishedAt: string | null;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  isPinned: boolean;
  isFeatured: boolean;
  likedByMe?: boolean;
}

export interface NewsDetails extends NewsSummary {
  content: string;
  contentHtml: string | null;
  status: NewsStatus;
  tags: string[];
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string[];
  ogImage: string | null;
  allowComments: boolean;
  scheduledFor: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewsAdminItem extends NewsDetails {
  authorId: string;
}

export interface NewsCategoryCount {
  category: NewsCategory;
  count: number;
}

export interface NewsTagCount {
  tag: string;
  count: number;
}

export interface NewsCommentAuthor {
  id: string;
  username: string;
  avatar: string | null;
  position: import('./position').Position;
  badges: import('./profile').UserBadge[];
}

export interface NewsCommentReactionSummary {
  emoji: import('./comments').CommentEmoji;
  count: number;
  reacted: boolean;
  users: Array<{ id: string; username: string }>;
}

export interface NewsComment {
  id: string;
  newsId: string;
  author: NewsCommentAuthor;
  content: string;
  contentHtml: string | null;
  parentId: string | null;
  isPinned: boolean;
  isDeleted: boolean;
  isEdited: boolean;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
  reactions: NewsCommentReactionSummary[];
  replies: NewsComment[];
  canEdit: boolean;
  canDelete: boolean;
}

export interface NewsStats {
  total: number;
  published: number;
  drafts: number;
  scheduled: number;
  archived: number;
  topByViews: NewsSummary[];
  topByLikes: NewsSummary[];
  topByComments: NewsSummary[];
  activityByDay: Array<{ date: string; count: number }>;
}

export interface CreateNewsPayload {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  category: NewsCategory;
  coverImage?: string;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImage?: string;
  allowComments?: boolean;
  isPinned?: boolean;
  isFeatured?: boolean;
  status?: NewsStatus;
  scheduledFor?: string | null;
}

export type UpdateNewsPayload = Partial<CreateNewsPayload>;
