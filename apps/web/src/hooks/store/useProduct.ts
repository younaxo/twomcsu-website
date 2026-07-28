'use client';

import type { StoreProduct } from '@twomc/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useProduct(slug: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.storeProduct(slug),
    queryFn: async () => {
      const { data } = await api.get<StoreProduct>(
        `/store/products/${encodeURIComponent(slug)}`,
        { skipAuthRedirect: true },
      );
      return data;
    },
    enabled: enabled && Boolean(slug),
  });
}
