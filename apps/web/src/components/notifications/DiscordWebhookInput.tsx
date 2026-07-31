'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDiscordWebhook } from '@/hooks/useNotificationSettings';
import { extractErrorMessage } from '@/lib/api';

export function DiscordWebhookInput({
  value,
  enabled,
}: {
  value: string | null;
  enabled: boolean;
}) {
  const [url, setUrl] = useState(value ?? '');
  const { save, remove, test } = useDiscordWebhook();

  return (
    <div className="space-y-2">
      <Input
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="https://discord.com/api/webhooks/..."
        disabled={!enabled}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          className="bg-[#F57C00] text-black hover:bg-[#E65100]"
          disabled={!enabled || !url.trim() || save.isPending}
          onClick={() =>
            void save
              .mutateAsync(url.trim())
              .then(() => toast.success('Webhook сохранён'))
              .catch((error) => toast.error(extractErrorMessage(error)))
          }
        >
          Сохранить
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={!enabled || !value || test.isPending}
          onClick={() =>
            void test
              .mutateAsync()
              .then((result) =>
                result.ok ? toast.success(result.message) : toast.error(result.message),
              )
              .catch((error) => toast.error(extractErrorMessage(error)))
          }
        >
          Проверить
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={!value || remove.isPending}
          onClick={() =>
            void remove
              .mutateAsync()
              .then(() => {
                setUrl('');
                toast.success('Webhook удалён');
              })
              .catch((error) => toast.error(extractErrorMessage(error)))
          }
        >
          Удалить
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        В Discord: Настройки канала → Интеграции → Вебхуки → Новый вебхук
      </p>
    </div>
  );
}
