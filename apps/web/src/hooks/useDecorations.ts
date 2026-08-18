'use client';

import type { OwnedProfileDecoration, ProfileDecoration } from '@twomc/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useDecorationCatalog() {
  return useQuery({
    queryKey: ['decorations'],
    queryFn: async () => (await api.get<ProfileDecoration[]>('/decorations', {
      skipAuthRedirect: true,
    })).data,
  });
}

export function useOwnedDecorations() {
  return useQuery({
    queryKey: ['decorations', 'mine'],
    queryFn: async () => (await api.get<OwnedProfileDecoration[]>('/decorations/mine')).data,
  });
}

export function useSelectedDecoration(username: string, enabled: boolean) {
  return useQuery({
    queryKey: ['decorations', 'selected', username.toLowerCase()],
    queryFn: async () => (await api.get<ProfileDecoration | null>(
      `/decorations/user/${encodeURIComponent(username)}/selected`,
      { skipAuthRedirect: true },
    )).data,
    enabled: enabled && Boolean(username),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useSelectDecoration() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (decorationId: string | null) =>
      api.patch('/decorations/selected', { decorationId }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['decorations'] }),
        client.invalidateQueries({ queryKey: ['auth'] }),
      ]);
    },
  });
}
