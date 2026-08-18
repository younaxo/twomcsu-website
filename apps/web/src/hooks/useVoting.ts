'use client';

import type { VotingOverview } from '@twomc/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useVoting(enabled = true) {
  return useQuery({
    queryKey: ['voting'],
    queryFn: async () =>
      (await api.get<VotingOverview>('/voting', { skipAuthRedirect: true })).data,
    enabled,
    refetchInterval: 60_000,
  });
}
