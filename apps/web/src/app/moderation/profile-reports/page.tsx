'use client';

import type { ProfileReport } from '@twomc/shared';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ShieldAlert } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AdminEmptyState } from '@/components/admin';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api, extractErrorMessage } from '@/lib/api';
import { profileReportLabels } from '@/lib/profile';

export default function AdminProfileReportsPage() {
  const [rows, setRows] = useState<ProfileReport[]>([]);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<ProfileReport[]>('/admin/profile-reports');
      setRows(data);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить жалобы'));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (id: string, status: 'RESOLVED' | 'REJECTED') => {
    try {
      await api.patch(`/admin/profile-reports/${id}`, { status });
      toast.success(status === 'RESOLVED' ? 'Жалоба закрыта' : 'Жалоба отклонена');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось обработать жалобу'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Жалобы на профили</h1>
        <p className="text-sm text-muted-foreground">Модерация жалоб</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Очередь</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <AdminEmptyState
              icon={ShieldAlert}
              title="Жалоб нет"
              description="Очередь модерации пуста"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Профиль</TableHead>
                  <TableHead>От кого</TableHead>
                  <TableHead>Причина</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <ColoredUsername user={row.profile} size="sm" />
                    </TableCell>
                    <TableCell>
                      <ColoredUsername user={row.reporter} size="sm" />
                    </TableCell>
                    <TableCell>{profileReportLabels[row.reason]}</TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell>
                      {format(new Date(row.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                    </TableCell>
                    <TableCell className="space-x-2">
                      {row.status === 'PENDING' ? (
                        <>
                          <Button type="button" size="sm" onClick={() => void review(row.id, 'RESOLVED')}>
                            Закрыть
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void review(row.id, 'REJECTED')}
                          >
                            Отклонить
                          </Button>
                        </>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
