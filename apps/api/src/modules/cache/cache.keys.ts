export const CACHE_TTL = {
  /** Public / private user profile by id or username */
  USER_PROFILE: 300,
  /** Single position by id or slug */
  POSITION: 1800,
  /** Full positions list */
  POSITIONS_LIST: 3600,
  /** Game statistics counters */
  PLAYER_STATS: 60,
  /** Accepted friends count */
  FRIENDS_COUNT: 60,
  /** Incoming pending requests count */
  INCOMING_REQUESTS_COUNT: 30,
  /** Server status / monitoring */
  SERVER_STATUS: 30,
} as const;

export const cacheKeys = {
  userById: (id: string) => `user:id:${id}`,
  userByUsername: (username: string) => `user:username:${username.toLowerCase()}`,
  userProfile: (username: string) => `user:profile:${username.toLowerCase()}`,
  positionsList: (group?: string, includeHidden?: boolean) =>
    `positions:list:${group ?? 'all'}:${includeHidden ? 'all' : 'visible'}`,
  positionBySlug: (slug: string) => `positions:slug:${slug}`,
  positionById: (id: string) => `positions:id:${id}`,
  playerStats: (userId: string) => `stats:user:${userId}`,
  friendsCount: (userId: string) => `friends:count:${userId}`,
  incomingCount: (userId: string) => `friends:incoming-count:${userId}`,
  authMe: (userId: string) => `auth:me:${userId}`,
} as const;
