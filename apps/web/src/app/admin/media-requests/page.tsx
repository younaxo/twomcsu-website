'use client';

import type { MediaBadgeRequestAdmin } from '@twomc/shared';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
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
import { mediaGroupLabels } from '@/lib/profile';

export default function AdminMediaRequestsPage() {
  const [rows, setRows] = useState<MediaBadgeRequestAdmin[]>([]);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<MediaBadgeRequestAdmin[]>('/admin/media-requests');
      setRows(data);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить заявки'));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.patch(`/admin/media-requests/${id}`, { status });
      toast.success(status === 'APPROVED' ? 'Заявка одобрена' : 'Заявка отклонена');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось обработать заявку'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Медиа-заявки</h1>
        <p className="text-sm text-muted-foreground">Модерация заявок на медиа-бейдж</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Очередь</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Игрок</TableHead>
                <TableHead>Платформа</TableHead>
                <TableHead>Канал</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <ColoredUsername user={row.user} size="sm" />
                  </TableCell>
                  <TableCell>{mediaGroupLabels[row.mediaGroup]}</TableCell>
                  <TableCell>
                    <a href={row.channelUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      ссылка
                    </a>
                  </TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell>
                    {format(new Date(row.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                  </TableCell>
                  <TableCell className="space-x-2">
                    {row.status === 'PENDING' ? (
                      <>
                        <Button type="button" size="sm" onClick={() => void review(row.id, 'APPROVED')}>
                          Одобрить
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
        </CardContent>
      </Card>
    </div>
  );
}
