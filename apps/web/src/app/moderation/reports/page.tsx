'use client';

import {
  REPORT_STATUS_LABELS,
  ReportStatus,
  ReportType,
} from '@twomc/shared';
import { Loader2, Search } from 'lucide-react';
import { useState } from 'react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useModerationReports } from '@/hooks/reports/useReports';
import { cn } from '@/lib/utils';

type TypeTab = 'all' | 'complaints' | 'appeals' | 'technical' | 'other';
type AssignedTab = 'all' | 'me' | 'free';

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
  const [page, setPage] = useState(1);
  const [typeTab, setTypeTab] = useState<TypeTab>('all');
  const [assignedTab, setAssignedTab] = useState<AssignedTab>('all');
  const [status, setStatus] = useState<ReportStatus | ''>('');
  const [search, setSearch] = useState('');

  const list = useModerationReports({
    page,
    limit: 20,
    type: typeFilter(typeTab) || undefined,
    status: status || undefined,
    assigned: assignedTab === 'all' ? undefined : assignedTab,
    search: search.trim() || undefined,
  });

  const items = list.data?.items ?? [];
  const totalPages = list.data?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Обращения на модерации</h1>

      <Tabs
        value={assignedTab}
        onValueChange={(value) => {
          setAssignedTab(value as AssignedTab);
          setPage(1);
        }}
      >
        <TabsList className="glass-medium">
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="me">Мои</TabsTrigger>
          <TabsTrigger value="free">Свободные</TabsTrigger>
        </TabsList>
      </Tabs>

      <Tabs
        value={typeTab}
        onValueChange={(value) => {
          setTypeTab(value as TypeTab);
          setPage(1);
        }}
      >
        <TabsList className="glass-medium">
          <TabsTrigger value="all">Все типы</TabsTrigger>
          <TabsTrigger value="complaints">Жалобы</TabsTrigger>
          <TabsTrigger value="appeals">Обжалования</TabsTrigger>
          <TabsTrigger value="technical">Технические</TabsTrigger>
          <TabsTrigger value="other">Другое</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-3 rounded-2xl glass-medium p-4 md:grid-cols-2">
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
      </div>

      {list.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Нет обращений"
          description="По текущим фильтрам ничего не найдено"
          className="glass-medium border-white/10"
        />
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <ReportCard
                key={item.id}
                report={item}
                href={`/moderation/reports/${item.reportNumber}`}
                className={cn(item.isOverdue && 'ring-1 ring-red-500/40')}
              />
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
