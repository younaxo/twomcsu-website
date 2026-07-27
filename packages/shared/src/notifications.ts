export const NotificationType = {
  COMMENT_ON_PROFILE: 'COMMENT_ON_PROFILE',
  COMMENT_MENTION: 'COMMENT_MENTION',
  COMMENT_REPLY: 'COMMENT_REPLY',
  FRIEND_REQUEST: 'FRIEND_REQUEST',
  FRIEND_ACCEPTED: 'FRIEND_ACCEPTED',
  GIFT_RECEIVED: 'GIFT_RECEIVED',
  ORDER_STATUS_CHANGED: 'ORDER_STATUS_CHANGED',
  SYSTEM: 'SYSTEM',
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  link: string | null;
  imageUrl: string | null;
  fromUserId: string | null;
  fromUsername?: string | null;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  items: AppNotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount?: number;
}

export interface UnreadNotificationsCount {
  count: number;
}
