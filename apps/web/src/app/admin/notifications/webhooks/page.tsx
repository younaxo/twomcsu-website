'use client';

import type { DiscordWebhookView } from '@twomc/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { api, extractErrorMessage } from '@/lib/api';

export default function AdminNotificationWebhooksPage() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [eventTypes, setEventTypes] = useState('REPORT_ASSIGNED,REPORT_VERDICT');

  const list = useQuery({
    queryKey: ['admin', 'notifications', 'webhooks'],
    queryFn: async () => {
      const { data } = await api.get<DiscordWebhookView[]>('/admin/notifications/webhooks');
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/admin/notifications/webhooks', {
        name,
        url,
        eventTypes: eventTypes.split(',').map((item) => item.trim()).filter(Boolean),
      });
      return data;
    },
    onSuccess: () => {
      setName('');
      setUrl('');
      void qc.invalidateQueries({ queryKey: ['admin', 'notifications', 'webhooks'] });
      toast.success('Webhook создан');
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api.patch(`/admin/notifications/webhooks/${id}`, { isActive });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'notifications', 'webhooks'] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/notifications/webhooks/${id}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'notifications', 'webhooks'] });
      toast.success('Удалено');
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Discord webhooks</h1>
        <p className="text-sm text-muted-foreground">Глобальные вебхуки для событий уведомлений</p>
      </div>

      <section className="space-y-3 rounded-2xl glass-medium p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Название</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Типы событий (через запятую)</Label>
          <Input value={eventTypes} onChange={(e) => setEventTypes(e.target.value)} />
        </div>
        <Button
          type="button"
          className="bg-[#F57C00] text-black hover:bg-[#E65100]"
          disabled={create.isPending}
          onClick={() =>
            void create.mutateAsync().catch((error) => toast.error(extractErrorMessage(error)))
          }
        >
          Добавить
        </Button>
      </section>

      <div className="space-y-3">
        {(list.data ?? []).map((webhook) => (
          <article key={webhook.id} className="rounded-2xl glass-medium p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-medium text-white">{webhook.name}</h2>
                <p className="text-xs text-muted-foreground">{webhook.eventTypes.join(', ')}</p>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={webhook.isActive}
                  onCheckedChange={(checked) =>
                    void toggle.mutateAsync({ id: webhook.id, isActive: checked })
                  }
                />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => void remove.mutateAsync(webhook.id)}
                >
                  Удалить
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
