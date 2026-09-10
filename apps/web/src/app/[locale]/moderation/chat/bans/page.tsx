'use client';

import { Ban } from 'lucide-react';
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

type BanRow = {
  id: string;
  reason: string;
  bannedUntil: string | null;
  user: { id: string; username: string };
};

export default function AdminChatBansPage() {
  const [items, setItems] = useState<BanRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<BanRow[]>('/admin/chat/bans');
      setItems(data);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить баны'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const unban = async (id: string) => {
    try {
      await api.delete(`/admin/chat/bans/${id}`);
      toast.success('Бан снят');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Баны чата" description="Активные блокировки" />
      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : items.length === 0 ? (
        <AdminEmptyState icon={Ban} title="Активных банов нет" />
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Игрок</TableHead>
                <TableHead>Причина</TableHead>
                <TableHead>До</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.user.username}</TableCell>
                  <TableCell>{row.reason}</TableCell>
                  <TableCell>
                    {row.bannedUntil
                      ? new Date(row.bannedUntil).toLocaleString('ru-RU')
                      : 'Навсегда'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => void unban(row.id)}>
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
