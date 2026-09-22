'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminStoreStats } from '@/hooks/store';
import { formatPrice } from '@/lib/store';

const PIE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6'];

export default function AdminStoreStatsPage() {
  const stats = useAdminStoreStats(true);
  const data = stats.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Статистика магазина</h1>
        <p className="text-sm text-muted-foreground">Выручка, заказы и разбивка по категориям</p>
      </div>

      {stats.isLoading || !data ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Выручка" value={formatPrice(data.overview.revenue)} />
            <StatCard title="Заказов" value={String(data.overview.ordersCount)} />
            <StatCard title="Средний чек" value={formatPrice(data.overview.averageOrder)} />
            <StatCard title="Продано товаров" value={String(data.overview.productsSold)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Оплачено" value={String(data.overview.completed)} />
            <StatCard title="Ожидают" value={String(data.overview.pending)} />
            <StatCard title="Отменено" value={String(data.overview.cancelled)} />
            <StatCard title="Возвраты" value={String(data.overview.refunded)} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Выручка по дням</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.revenueOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 15% 18%)" />
                  <XAxis dataKey="date" stroke="hsl(215 16% 65%)" fontSize={12} />
                  <YAxis stroke="hsl(215 16% 65%)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(215 19% 9%)',
                      border: '1px solid hsl(215 15% 18%)',
                    }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">По категориям</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.byCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
                      {data.byCategory.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(215 19% 9%)',
                        border: '1px solid hsl(215 15% 18%)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Топ товаров</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topProducts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 15% 18%)" />
                    <XAxis dataKey="name" stroke="hsl(215 16% 65%)" fontSize={11} />
                    <YAxis stroke="hsl(215 16% 65%)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(215 19% 9%)',
                        border: '1px solid hsl(215 15% 18%)',
                      }}
                    />
                    <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {(data.byProductType?.length ?? 0) > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">По типам товаров</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byProductType}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 15% 18%)" />
                    <XAxis dataKey="name" stroke="hsl(215 16% 65%)" fontSize={11} />
                    <YAxis stroke="hsl(215 16% 65%)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(215 19% 9%)',
                        border: '1px solid hsl(215 15% 18%)',
                      }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-white">{value}</p>
      </CardContent>
    </Card>
  );
}
