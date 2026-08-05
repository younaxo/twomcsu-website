'use client';

import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

export type SparklinePoint = { value: number };

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  changePercent?: number;
  sparkline?: SparklinePoint[];
  className?: string;
}

function formatChange(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%`;
}

export function DashboardCard({
  title,
  value,
  icon: Icon,
  changePercent,
  sparkline,
  className,
}: DashboardCardProps) {
  const hasChange = typeof changePercent === 'number';
  const isPositive = hasChange && changePercent > 0;
  const isNegative = hasChange && changePercent < 0;
  const isNeutral = hasChange && changePercent === 0;

  return (
    <div className={cn('rounded-2xl glass-medium p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
          {hasChange ? (
            <div
              className={cn(
                'mt-1.5 inline-flex items-center gap-1 text-xs font-medium',
                isPositive && 'text-emerald-400',
                isNegative && 'text-red-400',
                isNeutral && 'text-muted-foreground',
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              ) : isNegative ? (
                <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Minus className="h-3.5 w-3.5" aria-hidden />
              )}
              <span>{formatChange(changePercent)}</span>
              <span className="text-muted-foreground">к пред. периоду</span>
            </div>
          ) : null}
        </div>
        {Icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
            <Icon className="h-5 w-5 text-[#F57C00]" aria-hidden />
          </div>
        ) : null}
      </div>

      {sparkline && sparkline.length > 1 ? (
        <div className="mt-3 h-12 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkline}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="#F57C00"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  );
}
