import type { MiniGameResult, RewardsOverview } from '@twomc/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useRewards() {
  return useQuery({
    queryKey: ['rewards'],
    queryFn: async () => (await api.get<RewardsOverview>('/rewards')).data,
  });
}
export function useClaimReward() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (cardIndex: number) =>
      (await api.post('/rewards/daily/claim', { cardIndex })).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['rewards'] }),
  });
}
export function useSpinWheel() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post('/rewards/wheel/spin')).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['rewards'] }),
  });
}
export function useGameHistory() {
  return useQuery({
    queryKey: ['minigames', 'history'],
    queryFn: async () => (await api.get<MiniGameResult[]>('/minigames/history')).data,
  });
}
export function usePlayGame(endpoint: 'roulette' | 'crash' | 'upgrader') {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      (await api.post<MiniGameResult>(`/minigames/${endpoint}`, payload)).data,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['minigames'] });
      void client.invalidateQueries({ queryKey: ['rewards'] });
    },
  });
}
