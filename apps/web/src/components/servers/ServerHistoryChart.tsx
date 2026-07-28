'use client';

import type { ServerHistoryPoint } from '@twomc/shared';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ServerHistoryChartProps {
  data: ServerHistoryPoint[];
  days: number;
}

export function ServerHistoryChart({ data, days }: ServerHistoryChartProps) {
  const chartData = data.map((point) => ({
    ...point,
    label: format(new Date(point.timestamp), days <= 1 ? 'HH:mm' : 'd MMM HH:mm', {
      locale: ru,
    }),
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
        Пока нет данных истории
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="onlineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={32}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 8,
            }}
            labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
            formatter={(value) => [String(value ?? 0), 'Онлайн']}
          />
          <Area
            type="monotone"
            dataKey="playerCount"
            stroke="hsl(var(--primary))"
            fill="url(#onlineFill)"
            strokeWidth={2}
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
