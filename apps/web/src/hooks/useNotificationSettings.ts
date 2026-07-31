'use client';

import type {
  DigestMode,
  NotificationSettings,
  NotificationType,
  NotificationTypeSetting,
} from '@twomc/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const settingsKey = ['notifications', 'settings'] as const;

export function useNotificationSettings(enabled = true) {
  return useQuery({
    queryKey: settingsKey,
    queryFn: async () => {
      const { data } = await api.get<NotificationSettings>('/notifications/settings');
      return data;
    },
    enabled,
  });
}

export function useUpdateNotificationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<NotificationSettings>) => {
      const { data } = await api.patch<NotificationSettings>('/notifications/settings', payload);
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(settingsKey, data);
    },
  });
}

export function useUpdateNotificationTypeSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      type,
      setting,
    }: {
      type: NotificationType;
      setting: NotificationTypeSetting;
    }) => {
      const { data } = await api.patch<NotificationSettings>(
        `/notifications/settings/type/${type}`,
        setting,
      );
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(settingsKey, data);
    },
  });
}

export function useResetNotificationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<NotificationSettings>('/notifications/settings/reset');
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(settingsKey, data);
    },
  });
}

export function useUpdateDigest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { digestMode: DigestMode; digestTime?: string }) => {
      const { data } = await api.patch<NotificationSettings>('/notifications/digest', payload);
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(settingsKey, data);
    },
  });
}

export function usePushSubscription() {
  const qc = useQueryClient();

  const subscribe = useMutation({
    mutationFn: async (subscription: PushSubscriptionJSON & { deviceName?: string }) => {
      const { data } = await api.post('/notifications/push/subscribe', {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        deviceName: subscription.deviceName,
      });
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: settingsKey });
    },
  });

  const unsubscribe = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notifications/push/subscribe/${id}`);
    },
  });

  return { subscribe, unsubscribe };
}

export function useDiscordWebhook() {
  const qc = useQueryClient();

  const save = useMutation({
    mutationFn: async (url: string) => {
      const { data } = await api.post<NotificationSettings>('/notifications/discord/webhook', {
        url,
      });
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(settingsKey, data);
    },
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { data } = await api.delete<NotificationSettings>('/notifications/discord/webhook');
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(settingsKey, data);
    },
  });

  const test = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ ok: boolean; message: string }>(
        '/notifications/discord/webhook/test',
      );
      return data;
    },
  });

  return { save, remove, test };
}
