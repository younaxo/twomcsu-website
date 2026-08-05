'use client';

import type { StoreBundle } from '@twomc/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useBundles(enabled = true) {
  return useQuery({
    queryKey: queryKeys.storeBundles,
    queryFn: async () => {
      const { data } = await api.get<StoreBundle[]>('/store/bundles', {
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled,
  });
}

export function useBundle(slug: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.storeBundle(slug),
    queryFn: async () => {
      const { data } = await api.get<StoreBundle>(
        `/store/bundles/${encodeURIComponent(slug)}`,
        { skipAuthRedirect: true },
      );
      return data;
    },
    enabled: enabled && Boolean(slug),
  });
}
