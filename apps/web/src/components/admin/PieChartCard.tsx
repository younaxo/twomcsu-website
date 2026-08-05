'use client';

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { ChartCard } from './ChartCard';
import { ADMIN_CHART_PALETTE, adminChartTooltipStyle } from './chart-theme';

export type PieChartDataPoint = {
  name: string;
  value: number;
};

interface PieChartCardProps {
  title: string;
  description?: string;
  data: PieChartDataPoint[];
  height?: number;
  className?: string;
  headerAction?: React.ReactNode;
  innerRadius?: number;
  formatTooltip?: (value: number) => string;
}

export function PieChartCard({
  title,
  description,
  data,
  height = 224,
  className,
  headerAction,
  innerRadius = 0,
  formatTooltip,
}: PieChartCardProps) {
  return (
    <ChartCard
      title={title}
      description={description}
      className={className}
      headerAction={headerAction}
    >
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              {...adminChartTooltipStyle}
              formatter={(value) =>
                formatTooltip && typeof value === 'number'
                  ? formatTooltip(value)
                  : value
              }
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius="80%"
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={ADMIN_CHART_PALETTE[index % ADMIN_CHART_PALETTE.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
