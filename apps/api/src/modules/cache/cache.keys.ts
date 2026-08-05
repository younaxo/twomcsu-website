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
  /** Profile comments list */
  PROFILE_COMMENTS: 30,
  /** Unread notifications counter */
  NOTIFICATIONS_UNREAD: 30,
  /** User autocomplete search */
  USER_SEARCH: 30,
  /** @mention autocomplete search */
  MENTION_SEARCH: 30,
  /** Custom emoji list */
  CUSTOM_EMOJIS: 1800,
  /** Live server status snapshot */
  SERVER_STATUS: 60,
  /** Servers list with status */
  SERVERS_LIST: 30,
  /** Server categories list */
  SERVER_CATEGORIES: 300,
  /** Servers overview stats */
  SERVERS_OVERVIEW: 300,
  /** Store category tree */
  STORE_CATEGORIES: 120,
  /** Store product list / detail */
  STORE_PRODUCTS: 60,
  /** Store bundles list / detail */
  STORE_BUNDLES: 60,
  /** Bulk and loyalty discounts */
  STORE_DISCOUNTS: 120,
  /** Recent purchases feed */
  STORE_RECENT_PURCHASES: 60,
  /** Admin store stats */
  STORE_ADMIN_STATS: 300,
  /** Chat channel metadata */
  CHAT_CHANNEL: 1800,
  /** Recent chat messages */
  CHAT_MESSAGES: 600,
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
  userSearch: (query: string, limit: number) =>
    `users:search:${query.trim().toLowerCase()}:${limit}`,
  mentionSearch: (query: string, limit: number) =>
    `users:mentions:${query.trim().toLowerCase()}:${limit}`,
  customEmojis: () => 'emojis:custom:list',
  customEmojisSearch: (query: string) => `emojis:custom:search:${query.trim().toLowerCase()}`,
  notificationsUnread: (userId: string) => `notifications:unread:${userId}`,
  serverStatus: (serverId: string) => `server:${serverId}:status`,
  serversList: () => 'servers:list',
  serverCategories: () => 'servers:categories',
  serversOverview: () => 'servers:overview',
  profileComments: (username: string, page: number, limit: number, sort: string) =>
    `comments:${username.toLowerCase()}:${page}:${limit}:${sort}`,
  profileCommentsPattern: (username: string) => `comments:${username.toLowerCase()}:*`,
  storeCategories: () => 'store:categories',
  storeProductsList: (hash: string) => `store:products:list:${hash}`,
  storeProductsListPattern: () => 'store:products:list:*',
  storeProductBySlug: (slug: string) => `store:products:slug:${slug}`,
  storeBundlesList: () => 'store:bundles:list',
  storeBundleBySlug: (slug: string) => `store:bundles:slug:${slug}`,
  storeBulkDiscounts: () => 'store:discounts:bulk',
  storeLoyaltyDiscounts: () => 'store:discounts:loyalty',
  storeRecentPurchases: () => 'store:recent-purchases',
  storeCurrencies: () => 'store:currencies',
  storeCurrencyRates: () => 'store:currency-rates',
  storeAdminStats: (key: string) => `store:admin-stats:${key}`,
  chatChannel: (slug: string) => `chat:channel:${slug}`,
  chatMessagesRecent: (channelId: string) => `chat:messages:${channelId}:recent`,
  chatOnline: (channelId: string) => `chat:online:${channelId}`,
  chatTyping: (channelId: string) => `chat:typing:${channelId}`,
} as const;
