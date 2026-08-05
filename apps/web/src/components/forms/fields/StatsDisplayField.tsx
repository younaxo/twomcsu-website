'use client';

import type { FormFieldDto } from '@twomc/shared';
import { useAutofill } from '@/hooks/forms';
import { FieldShell } from './field-shell';

interface Props {
  field: FormFieldDto;
}

// Read-only: shows autofill stats about the current user
export function StatsDisplayField({ field }: Props) {
  const { data } = useAutofill();
  const stats = data?.stats;

  return (
    <FieldShell field={field}>
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Часы игры" value={stats?.playTimeHours ?? '—'} />
        <StatCard label="Монеты" value={stats?.coins ?? '—'} />
        <StatCard label="Уровень" value={stats?.level ?? '—'} />
      </div>
      {data?.username ? (
        <p className="text-xs text-muted-foreground">Данные для {data.username}</p>
      ) : null}
    </FieldShell>
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
