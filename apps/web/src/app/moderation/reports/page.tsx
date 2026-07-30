'use client';

import {
  REPORT_STATUS_LABELS,
  REPORT_TYPE_LABELS,
  ReportStatus,
  ReportType,
} from '@twomc/shared';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useModerationReports } from '@/hooks/reports/useReports';
import { cn } from '@/lib/utils';

type TypeTab = 'all' | 'complaints' | 'appeals' | 'technical' | 'other';

function typeFilter(tab: TypeTab): ReportType | '' {
  switch (tab) {
    case 'complaints':
      return ReportType.PLAYER_COMPLAINT;
    case 'appeals':
      return ReportType.PUNISHMENT_APPEAL;
    case 'technical':
      return ReportType.TECHNICAL_ISSUE;
    case 'other':
      return ReportType.OTHER;
    default:
      return '';
  }
}

export default function ModerationReportsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<TypeTab>('all');
  const [status, setStatus] = useState<ReportStatus | ''>('');
  const [assigned, setAssigned] = useState('all');
  const [search, setSearch] = useState('');

  const list = useModerationReports({
    page,
    limit: 20,
    type: typeFilter(tab) || undefined,
    status: status || undefined,
    assigned: assigned === 'all' ? undefined : assigned,
    search: search.trim() || undefined,
  });

  const items = list.data?.items ?? [];
  const totalPages = list.data?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Обращения на модерации</h1>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value as TypeTab);
          setPage(1);
        }}
      >
        <TabsList className="glass-medium">
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="complaints">Жалобы</TabsTrigger>
          <TabsTrigger value="appeals">Обжалования</TabsTrigger>
          <TabsTrigger value="technical">Технические</TabsTrigger>
          <TabsTrigger value="other">Другое</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-3 rounded-2xl glass-medium p-4 md:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Номер, автор, цель..."
            className="pl-9"
          />
        </div>
        <Select
          value={status || 'all'}
          onValueChange={(value) => {
            setStatus(value === 'all' ? '' : (value as ReportStatus));
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {(Object.keys(REPORT_STATUS_LABELS) as ReportStatus[]).map((item) => (
              <SelectItem key={item} value={item}>
                {REPORT_STATUS_LABELS[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={assigned}
          onValueChange={(value) => {
            setAssigned(value);
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Назначение" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="me">Назначены мне</SelectItem>
            <SelectItem value="free">Свободные</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {list.isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : items.length === 0 ? (
        <EmptyState title="Нет обращений" description="По текущим фильтрам ничего не найдено" />
      ) : (
        <div className="overflow-hidden rounded-2xl glass-medium">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead>#</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Автор</TableHead>
                <TableHead>На кого</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Назначен</TableHead>
                <TableHead>SLA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.id}
                  className={cn(
                    'cursor-pointer border-white/5 hover:bg-white/[0.04]',
                    item.isOverdue && 'bg-red-500/15 text-red-100',
                  )}
                  onClick={() => router.push(`/moderation/reports/${item.reportNumber}`)}
                >
                  <TableCell className="font-mono text-sm text-primary">
                    {item.reportNumber}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ReportTypeIcon type={item.type} size="sm" />
                      <span className="text-xs">{REPORT_TYPE_LABELS[item.type]}</span>
                    </div>
                  </TableCell>
                  <TableCell>{item.author.username}</TableCell>
                  <TableCell>{item.targetUsername ?? '—'}</TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(item.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                  </TableCell>
                  <TableCell>
                    <ReportStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell>{item.assignedTo?.username ?? '—'}</TableCell>
                  <TableCell className="text-xs">
                    {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true, locale: ru })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
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
    </div>
  );
}
