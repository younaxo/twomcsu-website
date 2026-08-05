'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartCard } from './ChartCard';
import { ADMIN_CHART_COLORS, adminChartTooltipStyle } from './chart-theme';

export type BarChartDataPoint = Record<string, string | number>;

interface BarChartCardProps {
  title: string;
  description?: string;
  data: BarChartDataPoint[];
  dataKey: string;
  xKey?: string;
  height?: number;
  className?: string;
  headerAction?: React.ReactNode;
  fill?: string;
  formatTooltip?: (value: number) => string;
}

export function BarChartCard({
  title,
  description,
  data,
  dataKey,
  xKey = 'date',
  height = 224,
  className,
  headerAction,
  fill = ADMIN_CHART_COLORS.primary,
  formatTooltip,
}: BarChartCardProps) {
  return (
    <ChartCard
      title={title}
      description={description}
      className={className}
      headerAction={headerAction}
    >
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={ADMIN_CHART_COLORS.grid} />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11, fill: ADMIN_CHART_COLORS.text }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              width={36}
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
            <Bar dataKey={dataKey} fill={fill} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
