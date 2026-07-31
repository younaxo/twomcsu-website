export const NotificationType = {
  COMMENT_ON_PROFILE: 'COMMENT_ON_PROFILE',
  COMMENT_MENTION: 'COMMENT_MENTION',
  COMMENT_REPLY: 'COMMENT_REPLY',
  FRIEND_REQUEST: 'FRIEND_REQUEST',
  FRIEND_ACCEPTED: 'FRIEND_ACCEPTED',
  GIFT_RECEIVED: 'GIFT_RECEIVED',
  ORDER_STATUS_CHANGED: 'ORDER_STATUS_CHANGED',
  CHAT_MENTION: 'CHAT_MENTION',
  NEWS_PUBLISHED: 'NEWS_PUBLISHED',
  NEWS_COMMENT_REPLY: 'NEWS_COMMENT_REPLY',
  NEWS_LIKED: 'NEWS_LIKED',
  ANNOUNCEMENT: 'ANNOUNCEMENT',
  MAINTENANCE: 'MAINTENANCE',
  ACHIEVEMENT_UNLOCKED: 'ACHIEVEMENT_UNLOCKED',
  REPORT_ASSIGNED: 'REPORT_ASSIGNED',
  REPORT_VERDICT: 'REPORT_VERDICT',
  REPORT_TARGET: 'REPORT_TARGET',
  MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
  RANK_GRANTED: 'RANK_GRANTED',
  BADGE_GRANTED: 'BADGE_GRANTED',
  AWARD_GRANTED: 'AWARD_GRANTED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  DAILY_REWARD_AVAILABLE: 'DAILY_REWARD_AVAILABLE',
  SYSTEM: 'SYSTEM',
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const NotificationPriority = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type NotificationPriority =
  (typeof NotificationPriority)[keyof typeof NotificationPriority];

export const DigestMode = {
  INSTANT: 'INSTANT',
  HOURLY: 'HOURLY',
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
} as const;

export type DigestMode = (typeof DigestMode)[keyof typeof DigestMode];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  COMMENT_ON_PROFILE: 'Комментарии на профиле',
  COMMENT_MENTION: 'Упоминания',
  COMMENT_REPLY: 'Ответы на комментарии',
  FRIEND_REQUEST: 'Запросы в друзья',
  FRIEND_ACCEPTED: 'Принятие заявок',
  GIFT_RECEIVED: 'Подарки',
  ORDER_STATUS_CHANGED: 'Статус заказа',
  CHAT_MENTION: 'Упоминания в чате',
  NEWS_PUBLISHED: 'Новости',
  NEWS_COMMENT_REPLY: 'Ответы в новостях',
  NEWS_LIKED: 'Лайки новостей',
  ANNOUNCEMENT: 'Объявления',
  MAINTENANCE: 'Техработы',
  ACHIEVEMENT_UNLOCKED: 'Достижения',
  REPORT_ASSIGNED: 'Назначение обращения',
  REPORT_VERDICT: 'Вердикт обращения',
  REPORT_TARGET: 'Обращение на вас',
  MESSAGE_RECEIVED: 'Сообщения',
  RANK_GRANTED: 'Выдача ранга',
  BADGE_GRANTED: 'Выдача бейджа',
  AWARD_GRANTED: 'Выдача награды',
  PAYMENT_RECEIVED: 'Платежи',
  DAILY_REWARD_AVAILABLE: 'Ежедневная награда',
  SYSTEM: 'Системные',
};

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
  groupKey: string | null;
  priority: NotificationPriority;
  actionUrl: string | null;
  actionLabel: string | null;
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

export type NotificationChannelKey = 'site' | 'email' | 'push' | 'discord' | 'sound';

export type NotificationTypeSetting = Partial<Record<NotificationChannelKey, boolean>>;

export interface NotificationSettings {
  id: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  discordEnabled: boolean;
  discordWebhookUrl: string | null;
  soundEnabled: boolean;
  digestMode: DigestMode;
  digestTime: string | null;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  typeSettings: Partial<Record<NotificationType, NotificationTypeSetting>>;
  updatedAt: string;
}

export interface PushSubscriptionView {
  id: string;
  endpoint: string;
  userAgent: string | null;
  deviceName: string | null;
  createdAt: string;
  lastUsedAt: string;
}

export interface DiscordWebhookView {
  id: string;
  name: string;
  url: string;
  eventTypes: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  sentViaEmail: number;
  sentViaPush: number;
  sentViaDiscord: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}
