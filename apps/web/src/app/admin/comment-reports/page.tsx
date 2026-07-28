'use client';

import type { CommentReport, CommentReportStatus, PaginatedResponse } from '@twomc/shared';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Flag } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AdminEmptyState } from '@/components/admin';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api, extractErrorMessage } from '@/lib/api';

const reasonLabels: Record<CommentReport['reason'], string> = {
  SPAM: 'Спам',
  INAPPROPRIATE: 'Неприемлемый контент',
  HARASSMENT: 'Оскорбления',
  IMPERSONATION: 'Выдаёт себя за другого',
  OTHER: 'Другое',
};

export default function AdminCommentReportsPage() {
  const [rows, setRows] = useState<CommentReport[]>([]);
  const [status, setStatus] = useState<CommentReportStatus | 'ALL'>('PENDING');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<PaginatedResponse<CommentReport>>('/admin/comment-reports', {
        params: {
          status: status === 'ALL' ? undefined : status,
          page: 1,
          limit: 50,
        },
      });
      setRows(data.data);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить жалобы'));
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (id: string, nextStatus: 'RESOLVED' | 'REJECTED') => {
    try {
      await api.patch(`/admin/comment-reports/${id}`, { status: nextStatus });
      toast.success(nextStatus === 'RESOLVED' ? 'Комментарий удалён' : 'Жалоба отклонена');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось обработать жалобу'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Жалобы на комментарии</h1>
          <p className="text-sm text-muted-foreground">Модерация комментариев на профилях</p>
        </div>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as CommentReportStatus | 'ALL')}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Все</SelectItem>
            <SelectItem value="PENDING">Ожидают</SelectItem>
            <SelectItem value="RESOLVED">Одобрены</SelectItem>
            <SelectItem value="REJECTED">Отклонены</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Очередь</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <AdminEmptyState
              icon={Flag}
              title="Жалоб нет"
              description="Очередь модерации пуста"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Профиль</TableHead>
                  <TableHead>Автор</TableHead>
                  <TableHead>От кого</TableHead>
                  <TableHead>Комментарий</TableHead>
                  <TableHead>Причина</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.comment.profile.username}</TableCell>
                    <TableCell>{row.comment.author.username}</TableCell>
                    <TableCell>
                      <ColoredUsername user={row.reporter} size="sm" />
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{row.comment.content}</TableCell>
                    <TableCell>{reasonLabels[row.reason]}</TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell>
                      {format(new Date(row.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                    </TableCell>
                    <TableCell className="space-x-2">
                      {row.status === 'PENDING' ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void review(row.id, 'RESOLVED')}
                          >
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
