export const queryKeys = {
  me: ['auth', 'me'] as const,
  profile: (username: string) => ['profile', username] as const,
  myProfile: ['profile', 'me'] as const,
  friends: (page?: number, search?: string) => ['friends', 'list', page ?? 1, search ?? ''] as const,
  incomingRequests: (page?: number) => ['friends', 'incoming', page ?? 1] as const,
  outgoingRequests: (page?: number) => ['friends', 'outgoing', page ?? 1] as const,
  blockedUsers: (page?: number) => ['friends', 'blocked', page ?? 1] as const,
  friendStatus: (username: string) => ['friends', 'status', username] as const,
  friendsCount: (username?: string) =>
    username ? (['friends', 'count', username] as const) : (['friends', 'count', 'me'] as const),
  incomingCount: ['friends', 'incoming-count'] as const,
  positions: (group?: string) => ['positions', group ?? 'all'] as const,
  position: (slug: string) => ['positions', 'slug', slug] as const,
  comments: (username: string, page?: number, sort?: string) =>
    ['comments', username, page ?? 1, sort ?? 'newest'] as const,
  awards: ['awards'] as const,
  notifications: (filters: Record<string, unknown>) =>
    ['notifications', 'list', filters] as const,
  notificationsUnreadCount: ['notifications', 'unread-count'] as const,
  storeCategories: ['store', 'categories'] as const,
  storeProducts: (filters: Record<string, unknown>) =>
    ['store', 'products', filters] as const,
  storeProduct: (slug: string) => ['store', 'product', slug] as const,
  storeBundles: ['store', 'bundles'] as const,
  storeBundle: (slug: string) => ['store', 'bundle', slug] as const,
  storeCart: ['store', 'cart'] as const,
  storeWishlist: ['store', 'wishlist'] as const,
  storeUserWishlist: (username: string) =>
    ['store', 'wishlist', 'user', username] as const,
  storeOrders: (page?: number) => ['store', 'orders', page ?? 1] as const,
  storeOrder: (orderNumber: string) => ['store', 'order', orderNumber] as const,
  storeBulkDiscounts: ['store', 'bulk-discounts'] as const,
  storeCurrencies: ['store', 'currencies'] as const,
  storeRecentPurchases: (limit?: number) =>
    ['store', 'recent-purchases', limit ?? 12] as const,
  storeBoughtTogether: (productId: string) =>
    ['store', 'bought-together', productId] as const,
  adminStoreCategories: ['admin', 'store', 'categories'] as const,
  adminStoreProducts: ['admin', 'store', 'products'] as const,
  adminStoreBundles: ['admin', 'store', 'bundles'] as const,
  adminBulkDiscounts: ['admin', 'store', 'bulk-discounts'] as const,
  adminLoyalty: ['admin', 'store', 'loyalty'] as const,
  adminPromocodes: ['admin', 'promocodes'] as const,
  adminOrders: (filters?: Record<string, unknown>) =>
    ['admin', 'orders', filters ?? {}] as const,
  adminOrderStats: ['admin', 'orders', 'stats'] as const,
  adminStoreStats: ['admin', 'store', 'stats'] as const,
};
