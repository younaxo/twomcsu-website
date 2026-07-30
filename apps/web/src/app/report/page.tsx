'use client';

import {
  REPORT_STATUS_LABELS,
  REPORT_TYPE_LABELS,
  ReportStatus,
  ReportType,
} from '@twomc/shared';
import { Loader2, Mail, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/shared/EmptyState';
import { ReportCard } from '@/components/reports/ReportCard';
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
import { useAuth } from '@/hooks/useAuth';
import { useServers } from '@/hooks/servers';
import { useMyReportStats, useReports } from '@/hooks/reports/useReports';
import { cn } from '@/lib/utils';

function StatCard({
  label,
  value,
  color,
  active,
  onClick,
  loading,
}: {
  label: string;
  value: number;
  color: string;
  active?: boolean;
  onClick?: () => void;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-2xl glass-medium p-5 text-left transition hover:bg-white/[0.06]',
        active && 'ring-1 ring-[#F57C00]/60',
        onClick ? 'cursor-pointer' : 'cursor-default',
      )}
    >
      <p className="mb-2 text-sm text-muted-foreground">{label}</p>
      {loading ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <p className="text-3xl font-bold tabular-nums" style={{ color }}>
          {value}
        </p>
      )}
    </button>
  );
}

export default function ReportListPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const servers = useServers(isAuthenticated);
  const stats = useMyReportStats(isAuthenticated);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [server, setServer] = useState('');
  const [type, setType] = useState<ReportType | ''>('');
  const [status, setStatus] = useState<ReportStatus | ''>('');
  const [role, setRole] = useState<'author' | 'target' | 'moderator' | 'all'>('all');

  const list = useReports(
    {
      page,
      limit: 15,
      search: search.trim() || undefined,
      server: server || undefined,
      type: type || undefined,
      status: status || undefined,
      role,
    },
    isAuthenticated,
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return <Skeleton className="mx-auto h-96 max-w-6xl rounded-2xl" />;
  }

  const items = list.data?.items ?? [];
  const totalPages = list.data?.totalPages ?? 0;

  const setStatusFilter = (next: ReportStatus | '') => {
    setStatus(next);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header className="rounded-2xl glass-strong p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Mail className="h-12 w-12 shrink-0 text-[#F57C00]" strokeWidth={1.5} />
            <div>
              <h1 className="text-2xl font-bold text-white md:text-3xl">Обращения</h1>
              <p className="mt-1 text-sm text-muted-foreground md:text-base">
                Обращения с вашим участием — созданные вами или где вы указаны как цель
              </p>
            </div>
          </div>
          <Button
            asChild
            className="bg-[#F57C00] px-6 font-semibold uppercase tracking-wide text-black hover:bg-[#F57C00]/90"
          >
            <Link href="/report/new">
              <Plus className="mr-2 h-4 w-4" />
              Создать обращение
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Всего"
          value={stats.total}
          color="#F57C00"
          active={!status}
          loading={stats.isLoading}
          onClick={() => setStatusFilter('')}
        />
        <StatCard
          label="В ожидании"
          value={stats.pending}
          color="#F59E0B"
          active={status === ReportStatus.PENDING}
          loading={stats.isLoading}
          onClick={() =>
            setStatusFilter(status === ReportStatus.PENDING ? '' : ReportStatus.PENDING)
          }
        />
        <StatCard
          label="В работе"
          value={stats.inReview}
          color="#3B82F6"
          active={status === ReportStatus.IN_REVIEW}
          loading={stats.isLoading}
          onClick={() =>
            setStatusFilter(status === ReportStatus.IN_REVIEW ? '' : ReportStatus.IN_REVIEW)
          }
        />
        <StatCard
          label="Решено"
          value={stats.resolved}
          color="#10B981"
          active={status === ReportStatus.RESOLVED}
          loading={stats.isLoading}
          onClick={() =>
            setStatusFilter(status === ReportStatus.RESOLVED ? '' : ReportStatus.RESOLVED)
          }
        />
      </div>

      <div className="rounded-2xl glass-medium p-4 md:p-5">
        <p className="mb-4 text-sm font-medium text-white">Фильтры</p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Поиск по номеру или нику..."
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
              <SelectValue placeholder="Сервер" />
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
          <Select
            value={role}
            onValueChange={(value) => {
              setRole(value as 'author' | 'target' | 'moderator' | 'all');
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Роль" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все роли</SelectItem>
              <SelectItem value="author">Автор</SelectItem>
              <SelectItem value="target">Обвиняемый</SelectItem>
              <SelectItem value="moderator">Модератор</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={status || 'all'}
            onValueChange={(value) => {
              setStatus(value === 'all' ? '' : (value as ReportStatus));
              setPage(1);
            }}
          >
            <SelectTrigger className="md:col-span-2 xl:col-span-1">
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
        </div>
      </div>

      {list.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="У вас нет обращений"
          description={
            status || search || server || type
              ? 'По выбранным фильтрам ничего не найдено'
              : 'Создайте обращение, если нужна помощь модерации'
          }
          className="glass-medium border-white/10"
          action={
            <Button asChild className="bg-[#F57C00] text-black hover:bg-[#F57C00]/90">
              <Link href="/report/new">Создать обращение</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <ReportCard key={item.id} report={item} viewerUserId={user?.id} />
            ))}
          </div>
          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Назад
              </Button>
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                {list.isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
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
