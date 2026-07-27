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
  awards: ['awards'] as const,
};
