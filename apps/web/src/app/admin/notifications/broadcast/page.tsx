'use client';

import { NotificationPriority, NotificationType } from '@twomc/shared';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api, extractErrorMessage } from '@/lib/api';

export default function AdminNotificationBroadcastPage() {
  const [type, setType] = useState<string>(NotificationType.ANNOUNCEMENT);
  const [priority, setPriority] = useState<string>(NotificationPriority.NORMAL);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');

  const broadcast = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ count: number }>('/admin/notifications/broadcast', {
        type,
        priority,
        title,
        message: message || undefined,
        link: link || undefined,
      });
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Рассылка уведомлений</h1>
        <p className="text-sm text-muted-foreground">Отправка всем пользователям или выбранным</p>
      </div>

      <form
        className="space-y-4 rounded-2xl glass-medium p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void broadcast
            .mutateAsync()
            .then((result) => toast.success(`Отправлено: ${result.count}`))
            .catch((error) => toast.error(extractErrorMessage(error)));
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Тип</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(NotificationType).map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Приоритет</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(NotificationPriority).map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Заголовок</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Сообщение</Label>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
        </div>
        <div className="space-y-2">
          <Label>Ссылка</Label>
          <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/news" />
        </div>
        <Button
          type="submit"
          disabled={broadcast.isPending || title.trim().length < 2}
          className="bg-[#F57C00] text-black hover:bg-[#E65100]"
        >
          Отправить
        </Button>
      </form>
    </div>
  );
}
