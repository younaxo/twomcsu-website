'use client';

import type { CreateServerPayload, GameServer } from '@twomc/shared';
import { Pencil, Plus, ScrollText, Server, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/EmptyState';
import { ServerStatusBadge } from '@/components/servers/ServerStatusBadge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  useAdminServers,
  useCreateServer,
  useDeleteServer,
  useUpdateServer,
} from '@/hooks/servers';
import { extractErrorMessage } from '@/lib/api';

const emptyForm: CreateServerPayload = {
  name: '',
  slug: '',
  address: '',
  port: 25565,
  type: 'survival',
  description: '',
  iconUrl: '',
  maxPlayers: 100,
  isActive: true,
  order: 0,
};

export default function AdminServersPage() {
  const list = useAdminServers();
  const create = useCreateServer();
  const update = useUpdateServer();
  const remove = useDeleteServer();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GameServer | null>(null);
  const [form, setForm] = useState<CreateServerPayload>(emptyForm);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = list.data ?? [];
    if (!q) return rows;
    return rows.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q),
    );
  }, [list.data, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (server: GameServer) => {
    setEditing(server);
    setForm({
      name: server.name,
      slug: server.slug,
      address: server.address,
      port: server.port,
      type: server.type,
      description: server.description ?? '',
      iconUrl: server.iconUrl ?? '',
      maxPlayers: server.maxPlayers,
      isActive: server.isActive,
      order: server.order,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...form });
        toast.success('Сервер обновлён');
      } else {
        await create.mutateAsync(form);
        toast.success('Сервер создан');
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось сохранить сервер'));
    }
  };

  const onDelete = async (server: GameServer) => {
    if (!window.confirm(`Удалить сервер «${server.name}»?`)) return;
    try {
      await remove.mutateAsync(server.id);
      toast.success('Сервер удалён');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось удалить сервер'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Серверы</h1>
          <p className="text-sm text-muted-foreground">Мониторинг и управление игровыми серверами</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить сервер
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card/40 p-4">
        <Input
          placeholder="Поиск по названию, slug, адресу…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {list.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Server}
          title="Нет серверов"
          description="Добавьте первый сервер для мониторинга"
          action={
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Адрес</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Порядок</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((server) => (
                <TableRow key={server.id} className="hover:bg-accent/30">
                  <TableCell>
                    <div>
                      <p className="font-medium text-white">{server.name}</p>
                      <p className="text-xs text-muted-foreground">{server.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {server.address}:{server.port}
                  </TableCell>
                  <TableCell>{server.type}</TableCell>
                  <TableCell>
                    <ServerStatusBadge
                      online={server.status?.online ?? false}
                      playerCount={server.status?.playerCount}
                    />
                  </TableCell>
                  <TableCell>{server.order}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="icon" aria-label="Логи">
                        <Link href={`/admin/servers/${server.id}/logs`}>
                          <ScrollText className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Редактировать"
                        onClick={() => openEdit(server)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Удалить"
                        onClick={() => void onDelete(server)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Редактировать сервер' : 'Новый сервер'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label>Название</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                disabled={Boolean(editing)}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1.5">
                <Label>Адрес</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Порт</Label>
                <Input
                  type="number"
                  value={form.port ?? 25565}
                  onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Тип</Label>
                <Input
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Макс. игроков</Label>
                <Input
                  type="number"
                  value={form.maxPlayers ?? 100}
                  onChange={(e) => setForm({ ...form, maxPlayers: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Иконка URL</Label>
              <Input
                value={form.iconUrl ?? ''}
                onChange={(e) => setForm({ ...form, iconUrl: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Описание</Label>
              <Textarea
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Порядок</Label>
                <Input
                  type="number"
                  value={form.order ?? 0}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-end gap-2 pb-2">
                <Switch
                  checked={form.isActive ?? true}
                  onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                />
                <Label>Активен</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => void save()}
              disabled={create.isPending || update.isPending}
            >
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
