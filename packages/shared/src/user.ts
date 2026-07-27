import type { Position } from './position';

export const RoleGroup = {
  PLAYER: 'PLAYER',
  HELPER: 'HELPER',
  MODERATOR: 'MODERATOR',
  ADMIN: 'ADMIN',
  OWNER: 'OWNER',
} as const;

export type RoleGroup = (typeof RoleGroup)[keyof typeof RoleGroup];

/** From the lowest to the highest, index is the weight used by role checks */
export const roleGroupOrder: RoleGroup[] = [
  RoleGroup.PLAYER,
  RoleGroup.HELPER,
  RoleGroup.MODERATOR,
  RoleGroup.ADMIN,
  RoleGroup.OWNER,
];

export function hasRoleGroup(current: RoleGroup, required: RoleGroup): boolean {
  return roleGroupOrder.indexOf(current) >= roleGroupOrder.indexOf(required);
}

/** Safe to send to the client: no password, no login trail */
export interface PublicUser {
  id: string;
  shortId: number;
  tag: string;
  email: string;
  username: string;
  roleGroup: RoleGroup;
  position: Position;
  minecraftNick: string | null;
  avatar: string | null;
  isVerified: boolean;
  isBanned: boolean;
  createdAt: string;
}

/** Row of the username lookup in the admin panel */
export interface UserSearchResult {
  id: string;
  username: string;
  avatar: string | null;
  roleGroup: RoleGroup;
  position: Position;
}