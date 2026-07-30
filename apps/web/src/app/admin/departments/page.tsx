'use client';

import type { Department, UserDepartmentView, UserProfile, UserSearchResult } from '@twomc/shared';
import { MAX_USER_DEPARTMENTS, RoleGroup, hasRoleGroup } from '@twomc/shared';
import {
  ArrowDown,
  ArrowUp,
  Building2,
  Pencil,
  Plus,
  Trash2,
  UserMinus,
  UserPlus,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AdminEmptyState } from '@/components/admin';
import { UserSearchInput } from '@/components/shared/UserSearchInput';
import { resolveDepartmentIcon, DEPARTMENT_ICON_OPTIONS } from '@/lib/department-icons';
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
  order: number;
};

const emptyForm: FormState = {
  name: '',
  slug: '',
  color: '#3B82F6',
  icon: '',
  description: '',
  isActive: true,
  order: 0,
};

export default function AdminDepartmentsPage() {
  const { user } = useAuth();
  const isOwner = user ? hasRoleGroup(user.roleGroup, RoleGroup.OWNER) : false;
  const isAdmin = user ? hasRoleGroup(user.roleGroup, RoleGroup.ADMIN) : false;

  const [items, setItems] = useState<Department[]>([]);
  const [editing, setEditing] = useState<Department | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [userDepartments, setUserDepartments] = useState<UserDepartmentView[]>([]);
  const [assignId, setAssignId] = useState('');

  const load = useCallback(async () => {
    try {
      const endpoint = isOwner ? '/admin/departments' : '/departments';
      const { data } = await api.get<Department[]>(endpoint);
      setItems(data);
      if (!assignId && data[0]) setAssignId(data[0].id);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить отделы'));
    }
  }, [assignId, isOwner]);

  const loadUserDepartments = useCallback(async (username: string) => {
    try {
      const { data } = await api.get<UserProfile>(
        `/users/${encodeURIComponent(username)}/public`,
        { skipAuthRedirect: true },
      );
      setUserDepartments(data.departments ?? []);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить отделы игрока'));
      setUserDepartments([]);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    void load();
  }, [isAdmin, load]);

  useEffect(() => {
    if (!selectedUser) {
      setUserDepartments([]);
      return;
    }
    void loadUserDepartments(selectedUser.username);
  }, [selectedUser, loadUserDepartments]);

  if (!isAdmin) {
    return (
      <p className="text-sm text-muted-foreground">
        Управление отделами доступно администраторам.
      </p>
    );
  }

  const activeItems = items.filter((i) => i.isActive);
  const assignedIds = new Set(userDepartments.map((d) => d.departmentId));
  const availableToAssign = activeItems.filter((i) => !assignedIds.has(i.id));
  const atMax = userDepartments.length >= MAX_USER_DEPARTMENTS;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (item: Department) => {
    setEditing(item);
    setForm({
      name: item.name,
      slug: item.slug,
      color: item.color ?? '#3B82F6',
      icon: item.icon ?? '',
      description: item.description ?? '',
      isActive: item.isActive,
      order: item.order,
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
        order: form.order,
      };
      if (editing) {
        await api.patch(`/admin/departments/${editing.id}`, payload);
        toast.success('Отдел обновлён');
      } else {
        await api.post('/admin/departments', payload);
        toast.success('Отдел создан');
      }
      setFormOpen(false);
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось сохранить отдел'));
    }
  };

  const remove = async (item: Department) => {
    if (!window.confirm(`Удалить отдел «${item.name}»?`)) return;
    try {
      await api.delete(`/admin/departments/${item.id}`);
      toast.success('Отдел удалён');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось удалить отдел'));
    }
  };

  const assign = async () => {
    if (!selectedUser || !assignId) return;
    try {
      await api.post(`/admin/users/${selectedUser.id}/departments`, {
        departmentId: assignId,
      });
      toast.success(`Отдел назначен ${selectedUser.username}`);
      await loadUserDepartments(selectedUser.username);
      const next = availableToAssign.find((i) => i.id !== assignId);
      setAssignId(next?.id ?? '');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось назначить отдел'));
    }
  };

  const unassign = async (departmentId: string) => {
    if (!selectedUser) return;
    try {
      await api.delete(`/admin/users/${selectedUser.id}/departments/${departmentId}`);
      toast.success(`Отдел снят с ${selectedUser.username}`);
      await loadUserDepartments(selectedUser.username);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось снять отдел'));
    }
  };

  const moveDepartment = async (index: number, direction: -1 | 1) => {
    if (!selectedUser) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= userDepartments.length) return;

    const reordered = [...userDepartments];
    const [item] = reordered.splice(index, 1);
    reordered.splice(nextIndex, 0, item);

    const orders = reordered.map((dept, order) => ({
      departmentId: dept.departmentId,
      order,
    }));

    try {
      await api.patch(`/admin/users/${selectedUser.id}/departments/order`, { orders });
      setUserDepartments(reordered.map((dept, order) => ({ ...dept, order })));
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось изменить порядок'));
    }
  };

  return (
    <div className="space-y-6">
      {isOwner ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Отделы</h1>
              <p className="text-sm text-muted-foreground">
                Команды проекта: технический, PR, модерация и другие.
              </p>
            </div>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Создать отдел
            </Button>
          </div>

          {items.length === 0 ? (
            <AdminEmptyState
              icon={Building2}
              title="Нет отделов"
              description="Создайте первый отдел"
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
                      <TableHead>Отдел</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Порядок</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead className="w-24" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const Icon = resolveDepartmentIcon(item.icon);
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <span
                              className="block h-6 w-6 rounded-md border border-border"
                              style={{ backgroundColor: item.color ?? '#3B82F6' }}
                            />
                          </TableCell>
                          <TableCell>
                            <span
                              className="inline-flex items-center gap-1.5 font-medium"
                              style={{ color: item.color ?? undefined }}
                            >
                              {Icon ? <Icon className="h-4 w-4" aria-hidden /> : null}
                              {item.name}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{item.slug}</TableCell>
                          <TableCell className="text-muted-foreground">{item.order}</TableCell>
                          <TableCell>
                            {item.isActive ? (
                              <Badge variant="secondary">активен</Badge>
                            ) : (
                              <Badge variant="outline">скрыт</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEdit(item)}
                                aria-label="Редактировать"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(item)}
                                aria-label="Удалить"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Dialog open={formOpen} onOpenChange={setFormOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? 'Редактирование отдела' : 'Новый отдел'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Название</Label>
                  <Input
                    value={form.name}
                    placeholder="Технический"
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
                    <Label>Иконка</Label>
                    <Select
                      value={form.icon || '__none__'}
                      onValueChange={(v) =>
                        setForm((p) => ({ ...p, icon: v === '__none__' ? '' : v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите иконку" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Без иконки</SelectItem>
                        {DEPARTMENT_ICON_OPTIONS.map((iconName) => {
                          const Icon = resolveDepartmentIcon(iconName);
                          return (
                            <SelectItem key={iconName} value={iconName}>
                              <span className="inline-flex items-center gap-2">
                                {Icon ? <Icon className="h-4 w-4" /> : null}
                                {iconName}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Порядок</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.order}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, order: Number.parseInt(e.target.value, 10) || 0 }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Описание</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Активен</Label>
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
        </>
      ) : (
        <div>
          <h1 className="text-2xl font-semibold">Отделы игроков</h1>
          <p className="text-sm text-muted-foreground">
            Назначение отделов (до {MAX_USER_DEPARTMENTS} на игрока).
          </p>
        </div>
      )}

      <Card className="glass-medium border-white/5">
        <CardHeader>
          <CardTitle className="text-base">Отделы игрока</CardTitle>
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

          {selectedUser && userDepartments.length > 0 ? (
            <div className="space-y-2">
              <Label>Текущие отделы</Label>
              <ul className="space-y-1">
                {userDepartments.map((dept, index) => {
                  const Icon = resolveDepartmentIcon(dept.icon);
                  return (
                    <li
                      key={dept.id}
                      className="flex items-center justify-between rounded-md border border-white/10 px-3 py-2"
                    >
                      <span
                        className="inline-flex items-center gap-2 text-sm font-medium"
                        style={{ color: dept.color ?? undefined }}
                      >
                        {Icon ? <Icon className="h-4 w-4" aria-hidden /> : null}
                        {dept.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={index === 0}
                          onClick={() => moveDepartment(index, -1)}
                          aria-label="Выше"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={index === userDepartments.length - 1}
                          onClick={() => moveDepartment(index, 1)}
                          aria-label="Ниже"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => unassign(dept.departmentId)}
                          aria-label="Убрать"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : selectedUser ? (
            <p className="text-sm text-muted-foreground">Отделы не назначены</p>
          ) : null}

          <div className="space-y-2">
            <Label>Добавить отдел</Label>
            <Select
              value={assignId}
              onValueChange={setAssignId}
              disabled={atMax || availableToAssign.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    atMax
                      ? `Максимум ${MAX_USER_DEPARTMENTS} отдела`
                      : 'Выберите отдел'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableToAssign.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={assign}
              disabled={!selectedUser || !assignId || atMax}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Назначить
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
