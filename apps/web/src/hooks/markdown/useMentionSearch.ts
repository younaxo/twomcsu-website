'use client';

import type { MentionSearchResult } from '@twomc/shared';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useMentionSearch(query: string, enabled = true) {
  const [debounced] = useDebounce(query.trim(), 300);

  return useQuery({
    queryKey: queryKeys.mentionSearch(debounced),
    queryFn: async () => {
      const { data } = await api.get<MentionSearchResult[]>('/users/search-mentions', {
        params: { q: debounced, limit: 8 },
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled: enabled && debounced.length >= 1,
    staleTime: 30_000,
  });
}
