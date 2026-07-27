'use client';

import type {
  CreateServerPayload,
  GameServer,
  ServerHistoryPoint,
  ServerPlayer,
  ServersOverview,
  ServerStatusLogRow,
  ServerStatusSnapshot,
  UpdateServerPayload,
} from '@twomc/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

const POLL_MS = 30_000;

export function useServers(enabled = true) {
  return useQuery({
    queryKey: queryKeys.servers,
    queryFn: async () => {
      const { data } = await api.get<GameServer[]>('/servers');
      return data;
    },
    enabled,
    refetchInterval: POLL_MS,
  });
}

export function useServersOverview(enabled = true) {
  return useQuery({
    queryKey: queryKeys.serversOverview,
    queryFn: async () => {
      const { data } = await api.get<ServersOverview>('/servers/overview');
      return data;
    },
    enabled,
    refetchInterval: POLL_MS,
  });
}

export function useServer(slug: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.server(slug),
    queryFn: async () => {
      const { data } = await api.get<GameServer>(`/servers/${slug}`);
      return data;
    },
    enabled: enabled && Boolean(slug),
    refetchInterval: POLL_MS,
  });
}

export function useServerStatus(slug: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.serverStatus(slug),
    queryFn: async () => {
      const { data } = await api.get<ServerStatusSnapshot>(`/servers/${slug}/status`);
      return data;
    },
    enabled: enabled && Boolean(slug),
    refetchInterval: POLL_MS,
  });
}

export function useServerHistory(slug: string, days = 7, enabled = true) {
  return useQuery({
    queryKey: queryKeys.serverHistory(slug, days),
    queryFn: async () => {
      const { data } = await api.get<ServerHistoryPoint[]>(`/servers/${slug}/history`, {
        params: { days },
      });
      return data;
    },
    enabled: enabled && Boolean(slug),
    refetchInterval: POLL_MS * 2,
  });
}

export function useServerPlayers(slug: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.serverPlayers(slug),
    queryFn: async () => {
      const { data } = await api.get<ServerPlayer[]>(`/servers/${slug}/players`);
      return data;
    },
    enabled: enabled && Boolean(slug),
    refetchInterval: POLL_MS,
  });
}

export function useAdminServers(enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminServers,
    queryFn: async () => {
      const { data } = await api.get<GameServer[]>('/admin/servers');
      return data;
    },
    enabled,
  });
}

export function useAdminServerLogs(
  id: string,
  opts?: { page?: number; limit?: number; from?: string; to?: string; enabled?: boolean },
) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 50;
  const filters = { page, limit, from: opts?.from, to: opts?.to };

  return useQuery({
    queryKey: queryKeys.adminServerLogs(id, filters),
    queryFn: async () => {
      const { data } = await api.get<{
        items: ServerStatusLogRow[];
        total: number;
        page: number;
        limit: number;
      }>(`/admin/servers/${id}/logs`, { params: filters });
      return data;
    },
    enabled: (opts?.enabled ?? true) && Boolean(id),
  });
}

export function useCreateServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateServerPayload) => {
      const { data } = await api.post<GameServer>('/admin/servers', payload);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['servers'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'servers'] });
    },
  });
}

export function useUpdateServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateServerPayload & { id: string }) => {
      const { data } = await api.patch<GameServer>(`/admin/servers/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['servers'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'servers'] });
    },
  });
}

export function useDeleteServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/servers/${id}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['servers'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'servers'] });
    },
  });
}
