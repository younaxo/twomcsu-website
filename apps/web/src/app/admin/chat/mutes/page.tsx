'use client';

import { VolumeX } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AdminEmptyState, AdminPageHeader } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api, extractErrorMessage } from '@/lib/api';

type MuteRow = {
  id: string;
  reason: string;
  mutedUntil: string | null;
  user: { id: string; username: string };
  channel: { id: string; slug: string; name: string } | null;
};

export default function AdminChatMutesPage() {
  const [items, setItems] = useState<MuteRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<MuteRow[]>('/admin/chat/mutes');
      setItems(data);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить муты'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const unmute = async (id: string) => {
    try {
      await api.delete(`/admin/chat/mutes/${id}`);
      toast.success('Мут снят');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Муты чата" description="Активные ограничения" />
      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : items.length === 0 ? (
        <AdminEmptyState icon={VolumeX} title="Активных мутов нет" />
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Игрок</TableHead>
                <TableHead>Канал</TableHead>
                <TableHead>Причина</TableHead>
                <TableHead>До</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.user.username}</TableCell>
                  <TableCell>{row.channel?.name ?? 'Все'}</TableCell>
                  <TableCell>{row.reason}</TableCell>
                  <TableCell>
                    {row.mutedUntil
                      ? new Date(row.mutedUntil).toLocaleString('ru-RU')
                      : 'Навсегда'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => void unmute(row.id)}>
                      Снять
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
