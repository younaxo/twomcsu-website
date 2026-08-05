import type { RoleGroup } from './user';

/** Everything the UI needs to paint a nickname or a badge */
export interface Position {
  id: string;
  name: string;
  slug: string;
  displayName: string;
  group: RoleGroup;
  color: string;
  backgroundColor: string | null;
  icon: string | null;
  priority: number;
}

export interface PositionSummary extends Position {
  description: string | null;
  isVisible: boolean;
  isDefault: boolean;
  usersCount: number;
}

export interface PositionMember {
  id: string;
  username: string;
  avatar: string | null;
}

export interface PositionDetails extends PositionSummary {
  createdAt: string;
  updatedAt: string;
  users: PositionMember[];
}

export const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
