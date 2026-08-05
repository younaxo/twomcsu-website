'use client';

import type {
  ActivityDetail,
  ActivityEmoji,
  ActivityFeedFilter,
  ActivityFeedSettings,
  ActivityItem,
  ActivityStats,
  ActivityType,
  PaginatedResponse,
} from '@twomc/shared';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { useSocket } from '@/hooks/useSocket';

export type ActivityFeedFilters = {
  page?: number;
  limit?: number;
  type?: ActivityType;
  filter?: ActivityFeedFilter;
};

export function useActivityFeed(filters: ActivityFeedFilters = {}, enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.activityFeed(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get<PaginatedResponse<ActivityItem>>('/activity/feed', {
        params: { ...filters, page: pageParam, limit: filters.limit ?? 20 },
        skipAuthRedirect: true,
      });
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.hasNext ? last.pagination.page + 1 : undefined,
    enabled,
  });
}

export function useUserActivity(
  username: string,
  filters: Omit<ActivityFeedFilters, 'filter'> = {},
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: queryKeys.userActivity(username, filters),
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get<PaginatedResponse<ActivityItem>>(
        `/activity/feed/user/${encodeURIComponent(username)}`,
        {
          params: { ...filters, page: pageParam, limit: filters.limit ?? 20 },
          skipAuthRedirect: true,
        },
      );
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.hasNext ? last.pagination.page + 1 : undefined,
    enabled: enabled && Boolean(username),
  });
}

export function useActivityHighlights(period: 'day' | 'week' = 'week', enabled = true) {
  return useQuery({
    queryKey: queryKeys.activityHighlights(period),
    queryFn: async () => {
      const { data } = await api.get<ActivityItem[]>('/activity/feed/global-highlights', {
        params: { period, limit: 7 },
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled,
  });
}

export function useActivityById(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.activityById(id),
    queryFn: async () => {
      const { data } = await api.get<ActivityDetail>(`/activity/${id}`, {
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled: enabled && Boolean(id),
  });
}

export function useActivitySettings(enabled = true) {
  return useQuery({
    queryKey: queryKeys.activitySettings,
    queryFn: async () => {
      const { data } = await api.get<ActivityFeedSettings>('/activity/settings');
      return data;
    },
    enabled,
  });
}

export function useUpdateActivitySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ActivityFeedSettings>) => {
      const { data } = await api.patch<ActivityFeedSettings>('/activity/settings', payload);
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.activitySettings, data);
    },
  });
}

export function useToggleReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ activityId, emoji }: { activityId: string; emoji: ActivityEmoji }) => {
      const { data } = await api.post<ActivityItem>(`/activity/${activityId}/reactions`, {
        emoji,
      });
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.activityById(data.id), (old: ActivityDetail | undefined) =>
        old ? { ...old, ...data, comments: old.comments } : old,
      );
      void qc.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ activityId, content }: { activityId: string; content: string }) => {
      const { data } = await api.post<ActivityDetail>(`/activity/${activityId}/comments`, {
        content,
      });
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.activityById(data.id), data);
      void qc.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/activity/comments/${commentId}`);
      return commentId;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}

export function useHideActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      await api.delete(`/moderation/activity/${id}`, { data: { reason } });
      return id;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}

export function usePinActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pin }: { id: string; pin: boolean }) => {
      const { data } = pin
        ? await api.post<ActivityItem>(`/moderation/activity/${id}/pin`)
        : await api.delete<ActivityItem>(`/moderation/activity/${id}/pin`);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}

export function useAdminActivityList(
  filters: Record<string, unknown> = {},
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.adminActivity(filters),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<ActivityItem>>('/admin/activity', {
        params: filters,
      });
      return data;
    },
    enabled,
  });
}

export function useAdminActivityStats(enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminActivityStats,
    queryFn: async () => {
      const { data } = await api.get<ActivityStats>('/admin/activity/stats');
      return data;
    },
    enabled,
  });
}

export function useCreateCustomActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description?: string;
      imageUrl?: string;
      actionUrl?: string;
      type?: 'CUSTOM' | 'EVENT_ANNOUNCED';
      isPinned?: boolean;
    }) => {
      const { data } = await api.post<ActivityItem | null>('/admin/activity/custom', payload);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['activity'] });
      void qc.invalidateQueries({ queryKey: queryKeys.adminActivityStats });
    },
  });
}

export function useActivityRealtime(enabled = true) {
  const { socket } = useSocket(enabled);
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const onNew = (item: ActivityItem) => {
      qc.setQueriesData<{ pages: PaginatedResponse<ActivityItem>[]; pageParams: unknown[] }>(
        { queryKey: ['activity', 'feed'] },
        (old) => {
          if (!old?.pages?.length) return old;
          const [first, ...rest] = old.pages;
          if (first.data.some((a) => a.id === item.id)) return old;
          return {
            ...old,
            pages: [
              {
                ...first,
                data: [item, ...first.data],
                pagination: {
                  ...first.pagination,
                  total: first.pagination.total + 1,
                },
              },
              ...rest,
            ],
          };
        },
      );
    };

    const onUpdated = (item: Partial<ActivityItem> & { id: string }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.activityById(item.id) });
      void qc.invalidateQueries({ queryKey: ['activity', 'feed'] });
    };

    const onDeleted = (payload: { id: string }) => {
      void qc.invalidateQueries({ queryKey: ['activity'] });
      qc.removeQueries({ queryKey: queryKeys.activityById(payload.id) });
    };

    socket.on('activity:new', onNew);
    socket.on('activity:updated', onUpdated);
    socket.on('activity:deleted', onDeleted);

    return () => {
      socket.off('activity:new', onNew);
      socket.off('activity:updated', onUpdated);
      socket.off('activity:deleted', onDeleted);
    };
  }, [socket, qc]);
}
