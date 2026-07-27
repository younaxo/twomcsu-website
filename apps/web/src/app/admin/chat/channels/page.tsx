'use client';

import type { ChatChannel } from '@twomc/shared';
import { Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AdminEmptyState, AdminPageHeader } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

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

  const create = async () => {
    if (!name.trim() || !slug.trim()) return;
    try {
      await api.post('/admin/chat/channels', {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        type: 'GENERAL',
        icon: '💬',
      });
      toast.success('Канал создан');
      setName('');
      setSlug('');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Удалить канал?')) return;
    try {
      await api.delete(`/admin/chat/channels/${id}`);
      toast.success('Удалено');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Каналы чата" description="Управление каналами" />

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-3">
        <div className="space-y-1">
          <Label>Название</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Slug</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button onClick={() => void create()}>
            <Plus className="mr-2 h-4 w-4" />
            Создать
          </Button>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : items.length === 0 ? (
        <AdminEmptyState title="Нет каналов" description="Создайте первый канал" />
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Канал</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Slow mode</TableHead>
                <TableHead />
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
                  <TableCell>{row.slowMode ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => void remove(row.id)}>
                      <Trash2 className="h-4 w-4" />
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
