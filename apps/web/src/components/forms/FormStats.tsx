'use client';

import { FormFieldType, type FormStats as FormStatsData } from '@twomc/shared';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface Props {
  stats: FormStatsData;
}

const COLORS = ['#F57C00', '#FB8C00', '#FF9800', '#FFA726', '#FFB74D', '#FFCC80'];

export function FormStats({ stats }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Всего ответов" value={stats.totalResponses} />
        <StatCard label="Завершено" value={stats.completedResponses} />
        <StatCard
          label="Процент завершения"
          value={`${Math.round(stats.completionRate * 100)}%`}
        />
      </div>

      <div className="grid gap-4">
        {stats.fields.map((field) => {
          const distribution = field.distribution ?? {};
          const entries = Object.entries(distribution).map(([name, value]) => ({
            name,
            value,
          }));

          if (
            field.type === FormFieldType.RADIO ||
            field.type === FormFieldType.SELECT ||
            field.type === FormFieldType.CHECKBOX ||
            field.type === FormFieldType.RATING
          ) {
            const chartType =
              field.type === FormFieldType.RATING ? 'bar' : 'pie';
            return (
              <div key={field.fieldId} className="rounded-2xl glass-medium p-4">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold text-white">{field.label}</h3>
                  <span className="text-xs text-muted-foreground">{field.count} ответов</span>
                </div>
                <div className="mt-3 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'pie' ? (
                      <PieChart>
                        <Pie
                          data={entries}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={80}
                          label
                        >
                          {entries.map((_entry, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    ) : (
                      <BarChart data={entries}>
                        <XAxis dataKey="name" stroke="#666" fontSize={12} />
                        <YAxis stroke="#666" fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#F57C00" />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            );
          }

          if (field.type === FormFieldType.NUMBER || field.type === FormFieldType.CURRENCY_AMOUNT) {
            return (
              <div key={field.fieldId} className="rounded-2xl glass-medium p-4">
                <h3 className="text-sm font-semibold text-white">{field.label}</h3>
                <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
                  <StatCard label="Среднее" value={field.average ?? '—'} />
                  <StatCard label="Мин" value={field.min ?? '—'} />
                  <StatCard label="Макс" value={field.max ?? '—'} />
                </div>
              </div>
            );
          }

          return (
            <div key={field.fieldId} className="rounded-2xl glass-medium p-4">
              <h3 className="text-sm font-semibold text-white">{field.label}</h3>
              <p className="mt-2 text-xs text-muted-foreground">
                {field.count} ответов
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg glass-light p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
