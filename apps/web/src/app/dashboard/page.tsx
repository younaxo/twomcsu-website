'use client';

import Link from 'next/link';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { AdminPageHeader } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';

type DashboardData = {
  totalUsers: number;
  users24h: number;
  onlineInGame: number;
  siteOnline: number;
  ordersToday: number;
  revenueToday: number;
  openReports: number;
  commentReports: number;
  mediaPending: number;
  registrations: Array<{ date: string; count: number }>;
  revenue: Array<{ date: string; total: number }>;
};

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default function AdminDashboardPage() {
  const dash = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const { data } = await api.get<DashboardData>('/admin/dashboard');
      return data;
    },
    refetchInterval: 60_000,
  });

  const d = dash.data;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Дашборд"
        description="Ключевые метрики проекта"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href="/admin/broadcast">Рассылка</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/admin/servers">Серверы</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/dashboard/audit-log">Audit log</Link>
            </Button>
          </div>
        }
      />

      {dash.isLoading || !d ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Пользователи" value={d.totalUsers} hint={`+${d.users24h} за 24ч`} />
          <MetricCard label="Онлайн в игре" value={d.onlineInGame} />
          <MetricCard
            label="Заказы сегодня"
            value={d.ordersToday}
            hint={`Выручка: ${d.revenueToday.toLocaleString('ru-RU')} ₽`}
          />
          <MetricCard
            label="Открытые жалобы"
            value={d.openReports + d.commentReports}
            hint={`Медиа заявок: ${d.mediaPending}`}
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card/40 p-4">
          <h2 className="mb-3 text-sm font-medium text-white">Регистрации за 30 дней</h2>
          <div className="h-56">
            {d ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={d.registrations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" hide />
                  <YAxis allowDecimals={false} width={28} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-full w-full" />
            )}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card/40 p-4">
          <h2 className="mb-3 text-sm font-medium text-white">Выручка за 30 дней</h2>
          <div className="h-56">
            {d ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={d.revenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" hide />
                  <YAxis width={40} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="total" stroke="#22c55e" fill="rgba(34,197,94,0.2)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-full w-full" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
