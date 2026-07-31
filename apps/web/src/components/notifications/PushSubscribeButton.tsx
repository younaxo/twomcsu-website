'use client';

import { BellRing } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { usePushSubscription } from '@/hooks/useNotificationSettings';
import { api, extractErrorMessage } from '@/lib/api';
import { registerServiceWorker } from '@/lib/register-sw';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export function PushSubscribeButton() {
  const { subscribe } = usePushSubscription();
  const [loading, setLoading] = useState(false);

  const enable = async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Разрешение на уведомления не выдано');
        return;
      }

      const registration = await registerServiceWorker();
      if (!registration) {
        toast.error('Service Worker недоступен');
        return;
      }

      const { data } = await api.get<{ publicKey: string | null }>('/notifications/push/vapid-key');
      if (!data.publicKey) {
        toast.error('Push на сервере не настроен (нет VAPID ключей)');
        return;
      }

      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey),
      });

      await subscribe.mutateAsync(pushSubscription.toJSON());
      toast.success('Push-уведомления включены');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось подписаться на push'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      disabled={loading || subscribe.isPending}
      onClick={() => void enable()}
    >
      <BellRing className="mr-1 h-4 w-4" />
      Разрешить
    </Button>
  );
}
