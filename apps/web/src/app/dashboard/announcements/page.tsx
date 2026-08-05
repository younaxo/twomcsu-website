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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { api, extractErrorMessage } from '@/lib/api';

type Announcement = {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isActive: boolean;
};

const empty = { title: '', message: '', type: 'info', link: '', isActive: true };

export default function AdminAnnouncementsPage() {
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
        ...form,
        link: form.link || null,
      });
      toast.success('Объявление создано');
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
        description="Баннеры на главной странице"
        actions={
          <Button
            onClick={() => {
              setForm(empty);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Создать
          </Button>
        }
      />

      <AdminTable
        columns={[
          { id: 'title', header: 'Заголовок', cell: (r) => r.title },
          { id: 'type', header: 'Тип', cell: (r) => r.type },
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
            description="Создайте объявление для главной страницы"
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
      >
        <div className="space-y-1.5">
          <Label>Заголовок</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Текст</Label>
          <Textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Тип (info / warning / success / error)</Label>
          <Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Ссылка</Label>
          <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
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
