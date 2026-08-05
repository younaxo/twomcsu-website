'use client';

import type { PublicWishlistResponse } from '@twomc/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useUserWishlist(username: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.storeUserWishlist(username),
    queryFn: async () => {
      const { data } = await api.get<PublicWishlistResponse>(
        `/store/wishlist/${encodeURIComponent(username)}`,
        { skipAuthRedirect: true },
      );
      return data;
    },
    enabled: enabled && Boolean(username),
    retry: false,
  });
}
