'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { api, extractErrorMessage } from '@/lib/api';

type MaintenanceStatus = {
  isEnabled: boolean;
  title: string;
  message: string;
  estimatedEnd: string | null;
};

export default function AdminMaintenancePage() {
  const [status, setStatus] = useState<MaintenanceStatus | null>(null);
  const [title, setTitle] = useState('Технические работы');
  const [message, setMessage] = useState('');
  const [estimatedEnd, setEstimatedEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<MaintenanceStatus>('/admin/maintenance/status');
      setStatus(data);
      setTitle(data.title);
      setMessage(data.message);
      setEstimatedEnd(data.estimatedEnd ? data.estimatedEnd.slice(0, 16) : '');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить статус'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (enable: boolean) => {
    setPending(true);
    try {
      if (enable) {
        const { data } = await api.post<MaintenanceStatus>('/admin/maintenance/enable', {
          title,
          message,
          estimatedEnd: estimatedEnd ? new Date(estimatedEnd).toISOString() : null,
        });
        setStatus(data);
        toast.success('Режим техработ включён');
      } else {
        const { data } = await api.post<MaintenanceStatus>('/admin/maintenance/disable');
        setStatus(data);
        toast.success('Режим техработ выключен');
      }
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось изменить режим'));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Технические работы"
        description="Полная блокировка сайта для всех, кроме администраторов"
      />
      <div className="glass-medium max-w-xl space-y-4 rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">Режим техработ</p>
            <p className="text-sm text-muted-foreground">
              {status?.isEnabled ? 'Сейчас включён' : 'Сейчас выключен'}
            </p>
          </div>
          <Switch
            checked={Boolean(status?.isEnabled)}
            disabled={loading || pending}
            onCheckedChange={(checked) => void toggle(checked)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Заголовок</Label>
          <Input value={title} disabled={loading} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Сообщение</Label>
          <Textarea
            value={message}
            disabled={loading}
            rows={4}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Ожидаемое окончание</Label>
          <Input
            type="datetime-local"
            value={estimatedEnd}
            disabled={loading}
            onChange={(e) => setEstimatedEnd(e.target.value)}
          />
        </div>
        {status?.isEnabled ? (
          <Button disabled={pending} onClick={() => void toggle(true)}>
            Обновить сообщение
          </Button>
        ) : null}
      </div>
    </div>
  );
}
