export const DirectMessagePolicy = {
  EVERYONE: 'EVERYONE',
  FRIENDS_OF_FRIENDS: 'FRIENDS_OF_FRIENDS',
  FRIENDS: 'FRIENDS',
  NOBODY: 'NOBODY',
} as const;

export type DirectMessagePolicy =
  (typeof DirectMessagePolicy)[keyof typeof DirectMessagePolicy];

export const ConversationType = {
  DIRECT: 'DIRECT',
  GROUP: 'GROUP',
} as const;

export type ConversationType = (typeof ConversationType)[keyof typeof ConversationType];

export const ConversationRole = {
  OWNER: 'OWNER',
  MODERATOR: 'MODERATOR',
  MEMBER: 'MEMBER',
} as const;

export type ConversationRole = (typeof ConversationRole)[keyof typeof ConversationRole];

export interface ConversationUser {
  id: string;
  username: string;
  avatar: string | null;
}

export interface ConversationMember {
  id: string;
  user: ConversationUser;
  role: ConversationRole;
  joinedAt: string;
  lastReadAt: string;
  isMuted: boolean;
}

export interface DirectMessageReaction {
  emoji: string;
  count: number;
  reactedByMe: boolean;
  users: ConversationUser[];
}

export interface MessageAttachment {
  id: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  sender: ConversationUser | null;
  content: string;
  contentHtml: string;
  parent: Pick<DirectMessage, 'id' | 'content' | 'sender'> | null;
  reactions: DirectMessageReaction[];
  attachments: MessageAttachment[];
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  title: string;
  avatar: string | null;
  role: ConversationRole;
  members: ConversationMember[];
  lastMessage: DirectMessage | null;
  lastMessageAt: string;
  unreadCount: number;
  isMuted: boolean;
  isArchived: boolean;
  createdAt: string;
}

export interface ConversationsResponse {
  items: Conversation[];
  totalUnread: number;
}

export interface DirectMessagesResponse {
  items: DirectMessage[];
  hasMore: boolean;
}

export interface GroupInvite {
  id: string;
  code: string;
  url: string;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface GroupInvitePreview {
  code: string;
  conversationId: string;
  title: string;
  avatar: string | null;
  membersCount: number;
  expiresAt: string | null;
  available: boolean;
  reason: string | null;
}

export const DIRECT_MESSAGE_POLICY_LABELS: Record<DirectMessagePolicy, string> = {
  EVERYONE: 'Все',
  FRIENDS_OF_FRIENDS: 'Друзья друзей',
  FRIENDS: 'Только друзья',
  NOBODY: 'Никто',
};

export const CONVERSATION_ROLE_LABELS: Record<ConversationRole, string> = {
  OWNER: 'Владелец',
  MODERATOR: 'Модератор',
  MEMBER: 'Участник',
};
