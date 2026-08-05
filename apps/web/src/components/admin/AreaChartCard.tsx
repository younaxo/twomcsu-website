'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartCard } from './ChartCard';
import { ADMIN_CHART_COLORS, adminChartTooltipStyle } from './chart-theme';

export type AreaChartDataPoint = Record<string, string | number>;

interface AreaChartCardProps {
  title: string;
  description?: string;
  data: AreaChartDataPoint[];
  dataKey: string;
  xKey?: string;
  height?: number;
  className?: string;
  headerAction?: React.ReactNode;
  stroke?: string;
  fill?: string;
  formatTooltip?: (value: number) => string;
}

export function AreaChartCard({
  title,
  description,
  data,
  dataKey,
  xKey = 'date',
  height = 224,
  className,
  headerAction,
  stroke = ADMIN_CHART_COLORS.primary,
  fill = 'rgba(245, 124, 0, 0.15)',
  formatTooltip,
}: AreaChartCardProps) {
  return (
    <ChartCard
      title={title}
      description={description}
      className={className}
      headerAction={headerAction}
    >
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={ADMIN_CHART_COLORS.grid} />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11, fill: ADMIN_CHART_COLORS.text }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              width={40}
              tick={{ fontSize: 11, fill: ADMIN_CHART_COLORS.text }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              {...adminChartTooltipStyle}
              formatter={(value) =>
                formatTooltip && typeof value === 'number'
                  ? formatTooltip(value)
                  : value
              }
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={stroke}
              fill={fill}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
