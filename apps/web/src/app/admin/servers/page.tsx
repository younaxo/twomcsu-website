'use client';

import type { CreateServerPayload, GameServer } from '@twomc/shared';
import { Pencil, Plus, ScrollText, Server, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AdminCreateEditDialog,
  AdminDeleteConfirm,
  AdminEmptyState,
  AdminFilters,
  AdminPageHeader,
  AdminTable,
  type AdminTableColumn,
} from '@/components/admin';
import { ServerStatusBadge } from '@/components/servers/ServerStatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  useAdminServers,
  useCreateServer,
  useDeleteServer,
  useServerCategories,
  useUpdateServer,
} from '@/hooks/servers';
import { extractErrorMessage } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  categoryId: null,
};

export default function AdminServersPage() {
  const list = useAdminServers();
  const categories = useServerCategories();
  const create = useCreateServer();
  const update = useUpdateServer();
  const remove = useDeleteServer();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GameServer | null>(null);
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

  const columns: AdminTableColumn<GameServer>[] = [
    {
      id: 'name',
      header: 'Название',
      cell: (server) => (
        <div>
          <p className="font-medium text-white">{server.name}</p>
          <p className="text-xs text-muted-foreground">{server.slug}</p>
        </div>
      ),
    },
    {
      id: 'address',
      header: 'Адрес',
      cell: (server) => (
        <span className="font-mono text-sm">
          {server.address}:{server.port}
        </span>
      ),
    },
    { id: 'type', header: 'Тип', cell: (server) => server.type },
    {
      id: 'status',
      header: 'Статус',
      cell: (server) => (
        <ServerStatusBadge
          online={server.status?.online ?? false}
          playerCount={server.status?.playerCount}
        />
      ),
    },
    { id: 'order', header: 'Порядок', cell: (server) => server.order },
  ];

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
      categoryId: server.categoryId,
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

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove.mutateAsync(deleteTarget.id);
      toast.success('Сервер удалён');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось удалить сервер'));
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Серверы"
        description="Мониторинг и управление игровыми серверами"
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить сервер
          </Button>
        }
      />

      <AdminFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Поиск по названию, slug, адресу…"
        onReset={() => setSearch('')}
      />

      <AdminTable
        columns={columns}
        data={filtered}
        rowKey={(s) => s.id}
        isLoading={list.isLoading}
        empty={
          <AdminEmptyState
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
        }
        actions={(server) => (
          <>
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
              onClick={() => setDeleteTarget(server)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </>
        )}
      />

      <AdminCreateEditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? 'Редактировать сервер' : 'Новый сервер'}
        onSubmit={() => void save()}
        isPending={create.isPending || update.isPending}
      >
        <div className="space-y-1.5">
          <Label>Название</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
            <Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
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
          <Label>Категория</Label>
          <Select
            value={form.categoryId ?? 'none'}
            onValueChange={(value) =>
              setForm({ ...form, categoryId: value === 'none' ? null : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Без категории" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Без категории</SelectItem>
              {(categories.data ?? []).map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      </AdminCreateEditDialog>

      <AdminDeleteConfirm
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={deleteTarget ? `Удалить «${deleteTarget.name}»?` : 'Удалить?'}
        onConfirm={() => void confirmDelete()}
        isPending={remove.isPending}
      />
    </div>
  );
}
