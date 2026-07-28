'use client';

import type { ChatChannel } from '@twomc/shared';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AdminEmptyState, AdminPageHeader } from '@/components/admin';
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

export default function AdminChatChannelsPage() {
  const [items, setItems] = useState<ChatChannel[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<ChatChannel[]>('/chat/channels');
      setItems(data);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить каналы'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Каналы чата"
        description="Сейчас используется один общий канал. Остальные каналы сохранены в БД на будущее."
      />

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : items.length === 0 ? (
        <AdminEmptyState title="Нет активных каналов" description="Запустите seed для создания general" />
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Канал</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Описание</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    {row.icon} {row.name}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{row.slug}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell className="text-muted-foreground">{row.description ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
