'use client';

import type {
  AppNotification,
  NotificationsResponse,
  UnreadNotificationsCount,
} from '@twomc/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useNotifications(opts?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  enabled?: boolean;
}) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const unreadOnly = opts?.unreadOnly ?? false;
  const enabled = opts?.enabled ?? true;

  return useQuery({
    queryKey: queryKeys.notifications({ page, limit, unreadOnly }),
    queryFn: async () => {
      const { data } = await api.get<NotificationsResponse>('/notifications', {
        params: {
          page,
          limit,
          unreadOnly: unreadOnly || undefined,
        },
      });
      return data;
    },
    enabled,
  });
}

export function useUnreadNotificationsCount(enabled = true) {
  return useQuery({
    queryKey: queryKeys.notificationsUnreadCount,
    queryFn: async () => {
      const { data } = await api.get<UnreadNotificationsCount>('/notifications/unread-count');
      return data;
    },
    enabled,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch<AppNotification>(`/notifications/${id}/read`);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.patch<{ count: number }>('/notifications/read-all');
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
