'use client';

import type { StreamChannel } from '@twomc/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useStreams() {
  return useQuery({
    queryKey: ['streams'],
    queryFn: async () =>
      (await api.get<StreamChannel[]>('/streams', { skipAuthRedirect: true })).data,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
