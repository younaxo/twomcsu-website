'use client';

import {
  REPORT_TYPE_LABELS,
  ReportType,
  type ReportSummary,
} from '@twomc/shared';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Mail, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/shared/EmptyState';
import { ReportStatusBadge } from '@/components/reports/ReportStatusBadge';
import { ReportTypeIcon } from '@/components/reports/ReportTypeIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useServers } from '@/hooks/servers';
import { useReports } from '@/hooks/reports/useReports';
import { cn } from '@/lib/utils';

function ReportsTable({ items }: { items: ReportSummary[] }) {
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-2xl glass-medium">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="text-neutral-400">#</TableHead>
            <TableHead className="text-neutral-400">Тип обращения</TableHead>
            <TableHead className="text-neutral-400">От игрока</TableHead>
            <TableHead className="text-neutral-400">Дата и время</TableHead>
            <TableHead className="text-neutral-400">Статус</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              className={cn(
                'cursor-pointer border-white/5 hover:bg-white/[0.04]',
                item.isOverdue && 'bg-red-500/10',
              )}
              onClick={() => router.push(`/report/${item.reportNumber}`)}
            >
              <TableCell className="font-mono text-sm text-primary">{item.reportNumber}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <ReportTypeIcon type={item.type} size="sm" />
                  <span className="text-sm text-white">{REPORT_TYPE_LABELS[item.type]}</span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-neutral-200">{item.author.username}</TableCell>
              <TableCell className="text-sm text-neutral-300">
                {format(new Date(item.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
              </TableCell>
              <TableCell>
                <ReportStatusBadge status={item.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function ReportListPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const servers = useServers(isAuthenticated);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [server, setServer] = useState('');
  const [type, setType] = useState<ReportType | ''>('');

  const list = useReports(
    {
      page,
      limit: 15,
      search: search.trim() || undefined,
      server: server || undefined,
      type: type || undefined,
    },
    isAuthenticated,
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  const items = list.data?.items ?? [];
  const totalPages = list.data?.totalPages ?? 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Mail className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-semibold text-white">Обращения с вашим участием</h1>
        </div>
        <Button asChild className="bg-[#F57C00] text-black hover:bg-[#F57C00]/90">
          <Link href="/report/new">
            <Plus className="mr-2 h-4 w-4" />
            Создать обращение
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 rounded-2xl glass-medium p-4 md:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Поиск..."
            className="pl-9"
          />
        </div>
        <Select
          value={server || 'all'}
          onValueChange={(value) => {
            setServer(value === 'all' ? '' : value);
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите сервер" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все серверы</SelectItem>
            {(servers.data ?? []).map((item) => (
              <SelectItem key={item.slug} value={item.slug}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={type || 'all'}
          onValueChange={(value) => {
            setType(value === 'all' ? '' : (value as ReportType));
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Тип обращения" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все типы</SelectItem>
            {(Object.keys(REPORT_TYPE_LABELS) as ReportType[])
              .filter((item) => item !== ReportType.DONATION_PROBLEM)
              .map((item) => (
                <SelectItem key={item} value={item}>
                  {REPORT_TYPE_LABELS[item]}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {list.isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="У вас нет обращений"
          description="Создайте обращение, если нужна помощь модерации"
          action={
            <Button asChild className="bg-[#F57C00] text-black hover:bg-[#F57C00]/90">
              <Link href="/report/new">Создать обращение</Link>
            </Button>
          }
        />
      ) : (
        <>
          <ReportsTable items={items} />
          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="secondary"
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
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Далее
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
