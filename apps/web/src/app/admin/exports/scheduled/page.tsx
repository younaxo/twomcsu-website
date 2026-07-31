'use client';

import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CalendarClock, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AdminEmptyState, AdminPageHeader } from '@/components/admin';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@/lib/api';

type ScheduledExport = {
  id: string;
  name: string;
  page: string;
  format: string;
  schedule: string;
  email: string | null;
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
};

const PAGE_OPTIONS = [
  { value: 'admin/users', label: 'Пользователи' },
  { value: 'admin/orders', label: 'Заказы' },
  { value: 'admin/reports', label: 'Обращения' },
  { value: 'admin/news', label: 'Новости' },
  { value: 'admin/audit-log', label: 'Audit log' },
];

const FORMAT_OPTIONS = [
  { value: 'csv', label: 'CSV' },
  { value: 'excel', label: 'Excel' },
  { value: 'pdf', label: 'PDF' },
];

const SCHEDULE_OPTIONS = [
  { value: 'daily', label: 'Ежедневно' },
  { value: 'weekly', label: 'Еженедельно' },
  { value: 'monthly', label: 'Ежемесячно' },
];

const emptyForm = {
  name: '',
  page: 'admin/users',
  format: 'csv',
  schedule: 'daily',
  email: '',
  isActive: true,
};

export default function ScheduledExportsPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduledExport | null>(null);
  const [form, setForm] = useState(emptyForm);

  const list = useQuery({
    queryKey: ['admin', 'exports', 'scheduled'],
    queryFn: async () => {
      const { data } = await api.get<ScheduledExport[]>('/admin/exports/scheduled');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: typeof emptyForm) =>
      api.post('/admin/exports/scheduled', {
        name: payload.name,
        page: payload.page,
        format: payload.format,
        schedule: payload.schedule,
        email: payload.email || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'exports', 'scheduled'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<typeof emptyForm>) =>
      api.patch(`/admin/exports/scheduled/${id}`, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'exports', 'scheduled'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/exports/scheduled/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'exports', 'scheduled'] });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item: ScheduledExport) => {
    setEditing(item);
    setForm({
      name: item.name,
      page: item.page,
      format: item.format,
      schedule: item.schedule,
      email: item.email ?? '',
      isActive: item.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Укажите название');
      return;
    }
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          name: form.name,
          page: form.page,
          format: form.format,
          schedule: form.schedule,
          email: form.email || undefined,
          isActive: form.isActive,
        });
        toast.success('Экспорт обновлён');
      } else {
        await createMutation.mutateAsync(form);
        toast.success('Экспорт создан');
      }
      setDialogOpen(false);
    } catch {
      toast.error('Не удалось сохранить');
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Запланированный экспорт"
        description="Автоматическая выгрузка данных по расписанию"
        actions={
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Создать
          </Button>
        }
      />

      {(list.data?.length ?? 0) === 0 && !list.isLoading ? (
        <AdminEmptyState
          icon={CalendarClock}
          title="Нет запланированных экспортов"
          description="Создайте задачу для автоматической выгрузки"
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl glass-medium">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Страница</TableHead>
                <TableHead>Формат</TableHead>
                <TableHead>Расписание</TableHead>
                <TableHead>След. запуск</TableHead>
                <TableHead>Активен</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(list.data ?? []).map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-white">{item.name}</TableCell>
                  <TableCell>{PAGE_OPTIONS.find((p) => p.value === item.page)?.label ?? item.page}</TableCell>
                  <TableCell>{item.format.toUpperCase()}</TableCell>
                  <TableCell>
                    {SCHEDULE_OPTIONS.find((s) => s.value === item.schedule)?.label ?? item.schedule}
                  </TableCell>
                  <TableCell>
                    {item.nextRunAt
                      ? format(new Date(item.nextRunAt), 'd MMM yyyy, HH:mm', { locale: ru })
                      : '—'}
                  </TableCell>
                  <TableCell>{item.isActive ? 'Да' : 'Нет'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => {
                          deleteMutation.mutate(item.id, {
                            onSuccess: () => toast.success('Удалено'),
                            onError: () => toast.error('Не удалось удалить'),
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Редактировать экспорт' : 'Новый экспорт'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Название</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Страница</Label>
              <Select value={form.page} onValueChange={(v) => setForm((f) => ({ ...f, page: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Формат</Label>
                <Select
                  value={form.format}
                  onValueChange={(v) => setForm((f) => ({ ...f, format: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Расписание</Label>
                <Select
                  value={form.schedule}
                  onValueChange={(v) => setForm((f) => ({ ...f, schedule: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email (необязательно)</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            {editing ? (
              <div className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2">
                <Label>Активен</Label>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                />
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button type="button" onClick={handleSubmit}>
              {editing ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
