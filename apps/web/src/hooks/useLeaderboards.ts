'use client';

import type { LeaderboardMetric, LeaderboardResponse } from '@twomc/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useLeaderboard(metric: LeaderboardMetric) {
  return useQuery({
    queryKey: ['leaderboards', metric],
    queryFn: async () => (await api.get<LeaderboardResponse>('/leaderboards', {
      params: { metric, limit: 50 },
      skipAuthRedirect: true,
    })).data,
    staleTime: 60_000,
  });
}
