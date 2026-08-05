'use client';

import type { CustomEmoji } from '@twomc/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useCustomEmojis(enabled = true) {
  return useQuery({
    queryKey: queryKeys.customEmojis,
    queryFn: async () => {
      const { data } = await api.get<CustomEmoji[]>('/emojis/custom', {
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled,
    staleTime: 30 * 60_000,
  });
}

export function useAdminCustomEmojis(enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminCustomEmojis,
    queryFn: async () => {
      const { data } = await api.get<CustomEmoji[]>('/admin/emojis');
      return data;
    },
    enabled,
  });
}
