'use client';

import { RoleGroup } from '@twomc/shared';
import { useState } from 'react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin';
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

export default function AdminBroadcastPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [roleGroup, setRoleGroup] = useState<string>('all');
  const [pending, setPending] = useState(false);

  const send = async () => {
    if (!title.trim()) {
      toast.error('Укажите заголовок');
      return;
    }
    setPending(true);
    try {
      const { data } = await api.post<{ count: number }>('/admin/broadcast', {
        title: title.trim(),
        message: message.trim() || undefined,
        link: link.trim() || undefined,
        roleGroup: roleGroup === 'all' ? undefined : roleGroup,
      });
      toast.success(`Отправлено: ${data.count}`);
      setTitle('');
      setMessage('');
      setLink('');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось отправить'));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Рассылка"
        description="Массовые уведомления пользователям"
      />
      <div className="max-w-xl space-y-4 rounded-xl border border-border bg-card/40 p-4">
        <div className="space-y-1.5">
          <Label>Заголовок</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
        </div>
        <div className="space-y-1.5">
          <Label>Сообщение</Label>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} />
        </div>
        <div className="space-y-1.5">
          <Label>Ссылка (опционально)</Label>
          <Input value={link} onChange={(e) => setLink(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Получатели</Label>
          <Select value={roleGroup} onValueChange={setRoleGroup}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все пользователи</SelectItem>
              <SelectItem value={RoleGroup.PLAYER}>Игроки</SelectItem>
              <SelectItem value={RoleGroup.HELPER}>Хелперы</SelectItem>
              <SelectItem value={RoleGroup.MODERATOR}>Модераторы</SelectItem>
              <SelectItem value={RoleGroup.ADMIN}>Админы</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => void send()} disabled={pending}>
          Отправить
        </Button>
      </div>
    </div>
  );
}
