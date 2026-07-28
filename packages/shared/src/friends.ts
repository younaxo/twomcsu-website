import type { Position } from './position';
import type { UserBadge } from './profile';

export const FriendshipStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  BLOCKED: 'BLOCKED',
  REJECTED: 'REJECTED',
} as const;

export type FriendshipStatus = (typeof FriendshipStatus)[keyof typeof FriendshipStatus];

export const FriendshipRelationStatus = {
  none: 'none',
  friends: 'friends',
  pending_sent: 'pending_sent',
  pending_received: 'pending_received',
  blocked_by_me: 'blocked_by_me',
  blocked_by_them: 'blocked_by_them',
  self: 'self',
} as const;

export type FriendshipRelationStatus =
  (typeof FriendshipRelationStatus)[keyof typeof FriendshipRelationStatus];

/** Compact user card for friends lists */
export interface FriendUser {
  id: string;
  username: string;
  avatar: string | null;
  position: Position;
  badges: UserBadge[];
}

export interface FriendshipStatusResponse {
  status: FriendshipRelationStatus;
  requestId: string | null;
}

export interface FriendsCountResponse {
  count: number;
}

export interface FriendRequestItem {
  id: string;
  status: FriendshipStatus;
  createdAt: string;
  user: FriendUser;
}

export interface BlockedUserItem {
  id: string;
  createdAt: string;
  user: FriendUser;
}

export interface FriendListItem {
  id: string;
  acceptedAt: string | null;
  createdAt: string;
  user: FriendUser;
}
