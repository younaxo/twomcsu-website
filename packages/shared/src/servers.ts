export interface ServerCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  order: number;
  isActive: boolean;
}

export interface ServerStatusSnapshot {
  online: boolean;
  playerCount: number;
  maxPlayers: number;
  players: string[];
  version: string | null;
  motd: string | null;
  ping: number | null;
  checkedAt: string;
}

export interface GameServer {
  id: string;
  name: string;
  slug: string;
  address: string;
  port: number;
  type: string;
  description: string | null;
  iconUrl: string | null;
  maxPlayers: number;
  version: string | null;
  motd: string | null;
  isActive: boolean;
  order: number;
  categoryId: string | null;
  category: ServerCategory | null;
  status: ServerStatusSnapshot | null;
}

export interface ServerPlayer {
  username: string;
  isRegistered: boolean;
  user: {
    id: string;
    username: string;
    avatar: string | null;
    shortId: number;
    tag: string;
  } | null;
  lastServerActivity: string | null;
}

export interface ServerHistoryPoint {
  timestamp: string;
  playerCount: number;
  online: boolean;
}

export interface ServersOverview {
  totalOnline: number;
  peakOnline24h: number;
  activeServers: number;
  topServers: Array<{
    id: string;
    name: string;
    slug: string;
    type: string;
    playerCount: number;
    maxPlayers: number;
    online: boolean;
  }>;
}

export interface CreateServerPayload {
  name: string;
  slug: string;
  address: string;
  port?: number;
  type: string;
  description?: string | null;
  iconUrl?: string | null;
  maxPlayers?: number;
  isActive?: boolean;
  order?: number;
  categoryId?: string | null;
}

export type UpdateServerPayload = Partial<CreateServerPayload>;

export interface CreateServerCategoryPayload {
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  order?: number;
  isActive?: boolean;
}

export type UpdateServerCategoryPayload = Partial<CreateServerCategoryPayload>;

export interface ServerStatusLogRow {
  id: string;
  online: boolean;
  playerCount: number;
  maxPlayers: number;
  players: string[];
  version: string | null;
  motd: string | null;
  ping: number | null;
  timestamp: string;
}
