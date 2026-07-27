import type { Position } from './position';
import type { UserBadgeType } from './profile';
import type { RoleGroup } from './user';

export const ChatChannelType = {
  GENERAL: 'GENERAL',
  TRADE: 'TRADE',
  HELP: 'HELP',
  ANNOUNCEMENTS: 'ANNOUNCEMENTS',
  GAME: 'GAME',
  FLOOD: 'FLOOD',
} as const;
export type ChatChannelType = (typeof ChatChannelType)[keyof typeof ChatChannelType];

export const ChatMessageType = {
  MESSAGE: 'MESSAGE',
  SYSTEM: 'SYSTEM',
  ANNOUNCEMENT: 'ANNOUNCEMENT',
  MOD_ACTION: 'MOD_ACTION',
} as const;
export type ChatMessageType = (typeof ChatMessageType)[keyof typeof ChatMessageType];

export const ChatMuteReason = {
  SPAM: 'SPAM',
  TOXIC: 'TOXIC',
  ADVERTISING: 'ADVERTISING',
  CAPS: 'CAPS',
  OTHER: 'OTHER',
} as const;
export type ChatMuteReason = (typeof ChatMuteReason)[keyof typeof ChatMuteReason];

export const CHAT_REACTION_EMOJIS = [
  'thumbs_up',
  'heart',
  'laugh',
  'wow',
  'sad',
  'angry',
  'party',
  'fire',
] as const;
export type ChatReactionEmoji = (typeof CHAT_REACTION_EMOJIS)[number];

export interface ChatChannel {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: ChatChannelType;
  icon: string | null;
  isActive: boolean;
  isReadOnly: boolean;
  slowMode: number | null;
  order: number;
  minRoleGroup: string | null;
}

export interface ChatMessageAuthor {
  id: string;
  username: string;
  avatar: string | null;
  roleGroup: RoleGroup;
  position?: Position | null;
  badges?: Array<{ id?: string; type: UserBadgeType | string }>;
}

export interface ChatMessageReactionSummary {
  emoji: string;
  count: number;
  reactedByMe: boolean;
}

export interface ChatLinkPreview {
  url: string;
  type: 'youtube' | 'twitch' | 'imgur' | 'og';
  embedId?: string;
  imageUrl?: string;
  title?: string;
  description?: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  authorId: string | null;
  author: ChatMessageAuthor | null;
  type: ChatMessageType;
  content: string;
  contentHtml: string;
  parentId: string | null;
  parent?: {
    id: string;
    content: string;
    author: { id: string; username: string } | null;
  } | null;
  mentions: string[];
  isPinned: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  metadata: { links?: ChatLinkPreview[] } | null;
  reactions: ChatMessageReactionSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatOnlineUser {
  id: string;
  username: string;
  avatar: string | null;
  roleGroup: RoleGroup;
}

export interface ChatMessagesResponse {
  items: ChatMessage[];
  hasMore: boolean;
}
