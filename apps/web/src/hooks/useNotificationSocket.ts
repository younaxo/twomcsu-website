'use client';

import type { AppNotification } from '@twomc/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { getApiAccessToken } from '@/lib/api';
import { playNotificationSound } from '@/lib/notification-sounds';
import { queryKeys } from '@/lib/query-keys';
import { registerServiceWorker } from '@/lib/register-sw';
import { useAuthStore } from '@/stores/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function useNotificationSocket(enabled = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();

  useEffect(() => {
    void registerServiceWorker();
  }, []);

  useEffect(() => {
    if (!enabled || !isAuthenticated) return;

    const token = accessToken ?? getApiAccessToken();
    if (!token) return;

    const socket = io(`${API_URL}/notifications`, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    const onNew = (notification: AppNotification) => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
      void qc.invalidateQueries({ queryKey: queryKeys.notificationsUnreadCount });
      playNotificationSound(notification.type);
      if (notification.priority === 'HIGH' || notification.priority === 'URGENT') {
        toast(notification.title, { description: notification.message ?? undefined });
      }
    };

    socket.on('notification:new', onNew);

    return () => {
      socket.off('notification:new', onNew);
      socket.disconnect();
    };
  }, [enabled, isAuthenticated, accessToken, qc]);
}
