'use client';

import { Megaphone, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  AdminCreateEditDialog,
  AdminDeleteConfirm,
  AdminEmptyState,
  AdminPageHeader,
  AdminTable,
} from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { api, extractErrorMessage } from '@/lib/api';

type Announcement = {
  id: string;
  title: string;
  message: string;
  type: string;
  isActive: boolean;
  isDismissible: boolean;
  showFrom: string | null;
  showUntil: string | null;
  targetRole: string | null;
  order: number;
};

const empty = {
  title: '',
  message: '',
  type: 'info',
  isActive: true,
  isDismissible: true,
  showFrom: '',
  showUntil: '',
  targetRole: 'all',
  order: 0,
};

export default function AdminAnnouncementsSettingsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<Announcement[]>('/admin/announcements');
      setItems(data);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить объявления'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setPending(true);
    try {
      await api.post('/admin/announcements', {
        title: form.title,
        message: form.message,
        type: form.type,
        isActive: form.isActive,
        isDismissible: form.isDismissible,
        showFrom: form.showFrom ? new Date(form.showFrom).toISOString() : null,
        showUntil: form.showUntil ? new Date(form.showUntil).toISOString() : null,
        targetRole: form.targetRole === 'all' ? null : form.targetRole,
        order: form.order,
      });
      toast.success('Объявление опубликовано');
      setDialogOpen(false);
      setForm(empty);
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось создать'));
    } finally {
      setPending(false);
    }
  };

  const remove = async () => {
    if (!deleteId) return;
    setPending(true);
    try {
      await api.delete(`/admin/announcements/${deleteId}`);
      toast.success('Удалено');
      setDeleteId(null);
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось удалить'));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Объявления"
        description="Баннеры под шапкой сайта"
        actions={
          <Button
            onClick={() => {
              setForm(empty);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Опубликовать
          </Button>
        }
      />

      <AdminTable
        columns={[
          { id: 'title', header: 'Заголовок', cell: (r) => r.title },
          { id: 'type', header: 'Тип', cell: (r) => r.type },
          { id: 'order', header: 'Порядок', cell: (r) => r.order },
          {
            id: 'active',
            header: 'Активно',
            cell: (r) => (r.isActive ? 'Да' : 'Нет'),
          },
        ]}
        data={items}
        rowKey={(r) => r.id}
        isLoading={loading}
        empty={
          <AdminEmptyState
            icon={Megaphone}
            title="Нет объявлений"
            description="Создайте объявление для баннера"
          />
        }
        actions={(row) => (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Удалить"
            onClick={() => setDeleteId(row.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      />

      <AdminCreateEditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Новое объявление"
        onSubmit={() => void save()}
        isPending={pending}
        submitLabel="Опубликовать"
      >
        <div className="space-y-1.5">
          <Label>Заголовок</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Сообщение (markdown)</Label>
          <Textarea
            value={form.message}
            rows={4}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Тип</Label>
          <Select value={form.type} onValueChange={(type) => setForm({ ...form, type })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="info">info</SelectItem>
              <SelectItem value="warning">warning</SelectItem>
              <SelectItem value="success">success</SelectItem>
              <SelectItem value="error">error</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Показывать с</Label>
            <Input
              type="datetime-local"
              value={form.showFrom}
              onChange={(e) => setForm({ ...form, showFrom: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Показывать до</Label>
            <Input
              type="datetime-local"
              value={form.showUntil}
              onChange={(e) => setForm({ ...form, showUntil: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Целевая роль</Label>
          <Select
            value={form.targetRole}
            onValueChange={(targetRole) => setForm({ ...form, targetRole })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="PLAYER">PLAYER</SelectItem>
              <SelectItem value="HELPER">HELPER+</SelectItem>
              <SelectItem value="MODERATOR">MODERATOR+</SelectItem>
              <SelectItem value="ADMIN">ADMIN+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Порядок</Label>
          <Input
            type="number"
            value={form.order}
            onChange={(e) => setForm({ ...form, order: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={form.isDismissible}
            onCheckedChange={(checked) =>
              setForm({ ...form, isDismissible: checked === true })
            }
            id="dismissible"
          />
          <Label htmlFor="dismissible">Можно закрыть</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={form.isActive}
            onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
          />
          <Label>Активно</Label>
        </div>
      </AdminCreateEditDialog>

      <AdminDeleteConfirm
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => void remove()}
        isPending={pending}
      />
    </div>
  );
}
