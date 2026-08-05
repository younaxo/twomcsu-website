'use client';

import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAdminServerLogs, useAdminServers } from '@/hooks/servers';

export default function AdminServerLogsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const servers = useAdminServers();
  const logs = useAdminServerLogs(id, {
    page,
    limit: 50,
    from: from || undefined,
    to: to || undefined,
  });

  const server = servers.data?.find((s) => s.id === id);
  const totalPages = Math.ceil((logs.data?.total ?? 0) / 50) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 px-0">
            <Link href="/admin/servers">← К серверам</Link>
          </Button>
          <h1 className="text-2xl font-semibold">
            Логи: {server?.name ?? id}
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card/40 p-4">
        <div className="space-y-1.5">
          <Label>С</Label>
          <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>По</Label>
          <Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            setFrom('');
            setTo('');
            setPage(1);
          }}
        >
          Сбросить
        </Button>
      </div>

      {logs.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Время</TableHead>
                <TableHead>Онлайн</TableHead>
                <TableHead>Игроки</TableHead>
                <TableHead>Ping</TableHead>
                <TableHead>Версия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(logs.data?.items ?? []).map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    {format(new Date(row.timestamp), 'd MMM yyyy, HH:mm:ss', { locale: ru })}
                  </TableCell>
                  <TableCell>{row.online ? 'Да' : 'Нет'}</TableCell>
                  <TableCell>
                    {row.playerCount}/{row.maxPlayers}
                  </TableCell>
                  <TableCell>{row.ping != null ? `${row.ping} мс` : '—'}</TableCell>
                  <TableCell>{row.version ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Назад
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Далее
          </Button>
        </div>
      ) : null}
    </div>
  );
}
