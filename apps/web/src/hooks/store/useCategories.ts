'use client';

import type { StoreCategory } from '@twomc/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useCategories(enabled = true) {
  return useQuery({
    queryKey: queryKeys.storeCategories,
    queryFn: async () => {
      const { data } = await api.get<StoreCategory[]>('/store/categories', {
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled,
  });
}
