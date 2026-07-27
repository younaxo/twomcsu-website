'use client';

import { PositionSummary, RoleGroup, hasRoleGroup, roleGroupOrder } from '@twomc/shared';
import { Pencil, Plus, Trash2, UserPlus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AssignPositionDialog } from '@/components/admin/AssignPositionDialog';
import { PositionFormDialog } from '@/components/admin/PositionFormDialog';
import { PositionBadge } from '@/components/shared/PositionBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { api, extractErrorMessage } from '@/lib/api';

const groupsTopDown = [...roleGroupOrder].reverse();

export default function AdminPositionsPage() {
  const { user } = useAuth();
  const [positions, setPositions] = useState<PositionSummary[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PositionSummary | null>(null);
  const [isFormOpen, setFormOpen] = useState(false);
  const [isAssignOpen, setAssignOpen] = useState(false);

  const isOwner = user ? hasRoleGroup(user.roleGroup, RoleGroup.OWNER) : false;

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<PositionSummary[]>('/positions/manage');
      setPositions(data);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить позиции'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (position: PositionSummary) => {
    setEditing(position);
    setFormOpen(true);
  };

  const remove = async (position: PositionSummary) => {
    if (!window.confirm(`Удалить позицию «${position.displayName}»?`)) {
      return;
    }

    try {
      await api.delete(`/positions/${position.id}`);
      toast.success('Позиция удалена');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось удалить позицию'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Позиции</h1>
          <p className="text-sm text-muted-foreground">
            Титулы внутри групп. Права зависят только от группы.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setAssignOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Назначить игроку
          </Button>
          {isOwner ? (
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Создать
            </Button>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        groupsTopDown.map((group) => {
          const rows = positions.filter((position) => position.group === group);

          if (rows.length === 0) {
            return null;
          }

          return (
            <Card key={group}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-base">
                  {group}
                  <span className="text-sm font-normal text-muted-foreground">
                    {rows.length} поз.
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Цвет</TableHead>
                      <TableHead>Позиция</TableHead>
                      <TableHead className="w-24 text-right">Приоритет</TableHead>
                      <TableHead className="w-24 text-right">Игроков</TableHead>
                      <TableHead className="w-32" />
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {rows.map((position) => (
                      <TableRow key={position.id}>
                        <TableCell>
                          <span
                            className="block h-6 w-6 rounded-md border border-border"
                            style={{ backgroundColor: position.color }}
                            title={position.color}
                          />
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-wrap items-center gap-2">
                            <PositionBadge position={position} />
                            {position.isDefault ? (
                              <Badge variant="secondary">по умолчанию</Badge>
                            ) : null}
                            {position.isVisible ? null : <Badge variant="outline">скрыта</Badge>}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{position.slug}</p>
                        </TableCell>

                        <TableCell className="text-right tabular-nums">
                          {position.priority}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {position.usersCount}
                        </TableCell>

                        <TableCell>
                          {isOwner ? (
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEdit(position)}
                                aria-label="Редактировать"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(position)}
                                aria-label="Удалить"
                                disabled={position.isDefault || position.usersCount > 0}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })
      )}

      <PositionFormDialog
        open={isFormOpen}
        position={editing}
        onOpenChange={setFormOpen}
        onSaved={load}
      />

      <AssignPositionDialog
        open={isAssignOpen}
        positions={positions}
        onOpenChange={setAssignOpen}
        onAssigned={load}
      />
    </div>
  );
}
