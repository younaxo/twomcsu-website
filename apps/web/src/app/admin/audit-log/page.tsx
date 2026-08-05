'use client';

import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronDown, ChevronRight, Download, ScrollText } from 'lucide-react';
import { Fragment, useState } from 'react';
import { toast } from 'sonner';
import {
  AdminEmptyState,
  AdminPageHeader,
  BarChartCard,
  ExportDialog,
  FilterPanel,
  PieChartCard,
} from '@/components/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuditLog, useAuditLogStats, useExportAuditLog } from '@/hooks/admin';
import type { AuditLogItem } from '@/hooks/admin';
import { cn } from '@/lib/utils';

const SEVERITY_LABELS: Record<string, string> = {
  info: 'Инфо',
  warning: 'Предупреждение',
  critical: 'Критично',
};

function severityClass(severity?: string): string {
  switch (severity) {
    case 'critical':
      return 'border-red-500/40 bg-red-500/10 text-red-300';
    case 'warning':
      return 'border-[#F57C00]/40 bg-[#F57C00]/10 text-[#F57C00]';
    default:
      return 'border-blue-500/30 bg-blue-500/10 text-blue-300';
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function AuditRow({ item }: { item: AuditLogItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Fragment>
      <tr
        className="cursor-pointer border-b border-white/5 hover:bg-white/5"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="py-2.5 pr-2">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </td>
        <td className="py-2.5 pr-2 text-sm text-muted-foreground">
          {format(new Date(item.createdAt), 'd MMM yyyy, HH:mm', { locale: ru })}
        </td>
        <td className="py-2.5 pr-2 text-sm text-white">{item.actor.username}</td>
        <td className="py-2.5 pr-2 text-sm">{item.action}</td>
        <td className="py-2.5 pr-2 text-sm text-muted-foreground">
          {item.targetType
            ? `${item.targetType}${item.targetId ? `:${item.targetId.slice(0, 8)}` : ''}`
            : '—'}
        </td>
        <td className="py-2.5">
          <Badge variant="outline" className={cn('border', severityClass(item.severity))}>
            {SEVERITY_LABELS[item.severity ?? 'info'] ?? item.severity ?? 'info'}
          </Badge>
        </td>
      </tr>
      {expanded ? (
        <tr className="border-b border-white/5 bg-white/[0.02]">
          <td colSpan={6} className="px-4 py-3 text-xs text-muted-foreground">
            <div className="grid gap-2 sm:grid-cols-2">
              {item.ipAddress ? <p>IP: {item.ipAddress}</p> : null}
              {item.userAgent ? <p className="truncate">UA: {item.userAgent}</p> : null}
              {item.duration != null ? <p>Длительность: {item.duration} мс</p> : null}
            </div>
            {item.changes ? (
              <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-black/20 p-2 text-[11px] text-white/80">
                {JSON.stringify(item.changes, null, 2)}
              </pre>
            ) : null}
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
}

export default function AdminAuditLogPage() {
  const [tab, setTab] = useState('log');
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [exportOpen, setExportOpen] = useState(false);

  const list = useAuditLog({
    page,
    limit: 50,
    q: search || undefined,
    severity: severity === 'all' ? undefined : severity,
    from: from || undefined,
    to: to || undefined,
  });
  const stats = useAuditLogStats(30);
  const exportAudit = useExportAuditLog();

  const severityChart = (stats.data?.bySeverity ?? []).map((row) => ({
    name: SEVERITY_LABELS[row.severity] ?? row.severity,
    count: row.count,
  }));

  const actionChart = (stats.data?.byAction ?? []).slice(0, 10).map((row) => ({
    name: row.action.length > 24 ? `${row.action.slice(0, 24)}…` : row.action,
    count: row.count,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Audit log"
        description="История действий администрации"
        actions={
          <Button type="button" variant="secondary" size="sm" onClick={() => setExportOpen(true)}>
            <Download className="mr-1.5 h-4 w-4" />
            Экспорт
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="glass-medium">
          <TabsTrigger value="log">Журнал</TabsTrigger>
          <TabsTrigger value="stats">Статистика</TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="mt-4 space-y-4">
          <FilterPanel
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            searchPlaceholder="Поиск по действию, цели, нику…"
            fields={[
              {
                type: 'select',
                id: 'severity',
                label: 'Важность',
                value: severity,
                onChange: (v) => {
                  setSeverity(v);
                  setPage(1);
                },
                options: [
                  { value: 'all', label: 'Все' },
                  { value: 'info', label: 'Инфо' },
                  { value: 'warning', label: 'Предупреждение' },
                  { value: 'critical', label: 'Критично' },
                ],
              },
              {
                type: 'dateRange',
                id: 'period',
                label: 'Период',
                from,
                to,
                onFromChange: (v) => {
                  setFrom(v);
                  setPage(1);
                },
                onToChange: (v) => {
                  setTo(v);
                  setPage(1);
                },
              },
            ]}
            onReset={() => {
              setSearch('');
              setSeverity('all');
              setFrom('');
              setTo('');
              setPage(1);
            }}
          />

          {list.isLoading ? (
            <Skeleton className="h-64 w-full rounded-2xl" />
          ) : (list.data?.items.length ?? 0) === 0 ? (
            <AdminEmptyState
              icon={ScrollText}
              title="Записей пока нет"
              description="Действия администраторов появятся здесь"
            />
          ) : (
            <div className="overflow-x-auto rounded-2xl glass-medium">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-xs text-muted-foreground">
                    <th className="w-8 p-3" />
                    <th className="p-3">Время</th>
                    <th className="p-3">Кто</th>
                    <th className="p-3">Действие</th>
                    <th className="p-3">Объект</th>
                    <th className="p-3">Важность</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data?.items.map((item) => <AuditRow key={item.id} item={item} />)}
                </tbody>
              </table>
            </div>
          )}

          {(list.data?.totalPages ?? 1) > 1 ? (
            <div className="flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Назад
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {list.data?.totalPages ?? 1}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= (list.data?.totalPages ?? 1)}
                onClick={() => setPage((p) => p + 1)}
              >
                Далее
              </Button>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="stats" className="mt-4 space-y-4">
          {stats.isLoading ? (
            <Skeleton className="h-64 w-full rounded-2xl" />
          ) : (
            <>
              <div className="glass-panel rounded-2xl p-4">
                <p className="text-sm text-muted-foreground">Записей за 30 дней</p>
                <p className="text-3xl font-semibold text-white">
                  {(stats.data?.total ?? 0).toLocaleString('ru-RU')}
                </p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <PieChartCard
                  title="По важности"
                  data={severityChart.map((d) => ({ name: d.name, value: d.count }))}
                />
                <BarChartCard
                  title="Топ действий"
                  data={actionChart}
                  dataKey="count"
                  xKey="name"
                  height={280}
                />
              </div>
              <div className="glass-panel rounded-2xl p-4">
                <h3 className="mb-3 text-sm font-medium text-white">Топ администраторов</h3>
                <ul className="space-y-2">
                  {(stats.data?.topActors ?? []).map((row, i) => (
                    <li
                      key={row.actor?.id ?? i}
                      className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-sm"
                    >
                      <span className="text-white">{row.actor?.username ?? '—'}</span>
                      <span className="text-muted-foreground">{row.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        columns={[{ id: 'all', label: 'Все поля' }]}
        title="Экспорт audit log"
        isExporting={exportAudit.isPending}
        onExport={async ({ format }) => {
          try {
            const blob = await exportAudit.mutateAsync({
              format,
              search: search || undefined,
              severity: severity === 'all' ? undefined : severity,
              dateFrom: from || undefined,
              dateTo: to || undefined,
            });
            downloadBlob(blob, `audit-log.${format === 'excel' ? 'xlsx' : format}`);
            setExportOpen(false);
            toast.success('Экспорт готов');
          } catch {
            toast.error('Не удалось экспортировать');
          }
        }}
      />
    </div>
  );
}
