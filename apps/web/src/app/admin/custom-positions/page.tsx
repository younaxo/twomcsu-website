'use client';

import type { CustomPosition, UserSearchResult } from '@twomc/shared';
import { RoleGroup, hasRoleGroup } from '@twomc/shared';
import { Briefcase, Pencil, Plus, Trash2, UserMinus, UserPlus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AdminEmptyState } from '@/components/admin';
import { UserSearchInput } from '@/components/shared/UserSearchInput';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { api, extractErrorMessage } from '@/lib/api';

type FormState = {
  name: string;
  slug: string;
  color: string;
  icon: string;
  description: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  name: '',
  slug: '',
  color: '#F57C00',
  icon: '',
  description: '',
  isActive: true,
};

export default function AdminCustomPositionsPage() {
  const { user } = useAuth();
  const isOwner = user ? hasRoleGroup(user.roleGroup, RoleGroup.OWNER) : false;
  const [items, setItems] = useState<CustomPosition[]>([]);
  const [editing, setEditing] = useState<CustomPosition | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [assignId, setAssignId] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<CustomPosition[]>('/admin/custom-positions');
      setItems(data);
      if (!assignId && data[0]) setAssignId(data[0].id);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить должности'));
    }
  }, [assignId]);

  useEffect(() => {
    if (!isOwner) return;
    void load();
  }, [isOwner, load]);

  if (!isOwner) {
    return (
      <p className="text-sm text-muted-foreground">
        Управление кастомными должностями доступно только владельцу.
      </p>
    );
  }

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (item: CustomPosition) => {
    setEditing(item);
    setForm({
      name: item.name,
      slug: item.slug,
      color: item.color ?? '#F57C00',
      icon: item.icon ?? '',
      description: item.description ?? '',
      isActive: item.isActive,
    });
    setFormOpen(true);
  };

  const syncSlug = (name: string) => {
    if (editing) return;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]+/gi, '-')
      .replace(/[^a-z0-9-]+/g, '')
      .replace(/^-|-$/g, '');
    setForm((prev) => ({ ...prev, name, slug: slug || prev.slug }));
  };

  const save = async () => {
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        color: form.color || undefined,
        icon: form.icon.trim() || undefined,
        description: form.description.trim() || undefined,
        isActive: form.isActive,
      };
      if (editing) {
        await api.patch(`/admin/custom-positions/${editing.id}`, payload);
        toast.success('Должность обновлена');
      } else {
        await api.post('/admin/custom-positions', payload);
        toast.success('Должность создана');
      }
      setFormOpen(false);
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось сохранить должность'));
    }
  };

  const remove = async (item: CustomPosition) => {
    if (!window.confirm(`Удалить должность «${item.name}»?`)) return;
    try {
      await api.delete(`/admin/custom-positions/${item.id}`);
      toast.success('Должность удалена');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось удалить должность'));
    }
  };

  const assign = async () => {
    if (!selectedUser || !assignId) return;
    try {
      await api.post(`/admin/users/${selectedUser.id}/custom-position`, {
        customPositionId: assignId,
      });
      toast.success(`Должность назначена ${selectedUser.username}`);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось назначить должность'));
    }
  };

  const unassign = async () => {
    if (!selectedUser) return;
    try {
      await api.delete(`/admin/users/${selectedUser.id}/custom-position`);
      toast.success(`Должность снята с ${selectedUser.username}`);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось снять должность'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Кастомные должности</h1>
          <p className="text-sm text-muted-foreground">
            Свободные титулы команды поверх префикса.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Создать должность
        </Button>
      </div>

      {items.length === 0 ? (
        <AdminEmptyState
          icon={Briefcase}
          title="Нет должностей"
          description="Создайте первую кастомную должность"
          action={
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Создать
            </Button>
          }
        />
      ) : (
        <Card className="glass-medium border-white/5">
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Цвет</TableHead>
                  <TableHead>Должность</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <span
                        className="block h-6 w-6 rounded-md border border-border"
                        style={{ backgroundColor: item.color ?? '#F57C00' }}
                      />
                    </TableCell>
                    <TableCell>
                      <span style={{ color: item.color ?? undefined }} className="font-medium italic">
                        {item.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.slug}</TableCell>
                    <TableCell>
                      {item.isActive ? (
                        <Badge variant="secondary">активна</Badge>
                      ) : (
                        <Badge variant="outline">скрыта</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)} aria-label="Редактировать">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(item)} aria-label="Удалить">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card className="glass-medium border-white/5">
        <CardHeader>
          <CardTitle className="text-base">Кастомная должность игрока</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedUser ? (
            <div className="flex items-center justify-between rounded-md border border-white/10 px-3 py-2">
              <span className="text-sm font-medium">{selectedUser.username}</span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                Сменить
              </Button>
            </div>
          ) : (
            <UserSearchInput placeholder="Начните вводить ник" onSelect={setSelectedUser} />
          )}
          <div className="space-y-2">
            <Label>Должность</Label>
            <Select value={assignId} onValueChange={setAssignId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите должность" />
              </SelectTrigger>
              <SelectContent>
                {items.filter((i) => i.isActive).map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={assign} disabled={!selectedUser || !assignId}>
              <UserPlus className="mr-2 h-4 w-4" />
              Назначить
            </Button>
            <Button variant="secondary" onClick={unassign} disabled={!selectedUser}>
              <UserMinus className="mr-2 h-4 w-4" />
              Убрать
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Редактирование должности' : 'Новая должность'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={form.name}
                placeholder="Технический директор"
                onChange={(e) => syncSlug(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Цвет</Label>
                <Input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Иконка (URL)</Label>
                <Input
                  value={form.icon}
                  onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Активна</Label>
              <Switch
                checked={form.isActive}
                onCheckedChange={(isActive) => setForm((p) => ({ ...p, isActive }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Отмена
            </Button>
            <Button onClick={save} disabled={!form.name.trim() || !form.slug.trim()}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
