'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartCard } from './ChartCard';
import { ADMIN_CHART_COLORS, adminChartTooltipStyle } from './chart-theme';

export type LineChartDataPoint = Record<string, string | number>;

interface LineChartCardProps {
  title: string;
  description?: string;
  data: LineChartDataPoint[];
  dataKey: string;
  xKey?: string;
  height?: number;
  className?: string;
  headerAction?: React.ReactNode;
  stroke?: string;
  formatTooltip?: (value: number) => string;
}

export function LineChartCard({
  title,
  description,
  data,
  dataKey,
  xKey = 'date',
  height = 224,
  className,
  headerAction,
  stroke = ADMIN_CHART_COLORS.primary,
  formatTooltip,
}: LineChartCardProps) {
  return (
    <ChartCard
      title={title}
      description={description}
      className={className}
      headerAction={headerAction}
    >
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
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
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={stroke}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: stroke }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
