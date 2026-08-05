'use client';

import type { FormFieldDto, PositionSummary } from '@twomc/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { FieldShell } from './field-shell';
import { extractChoices } from '../field-types';
import type { FieldValue } from '../types';

interface Props {
  field: FormFieldDto;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
  disabled?: boolean;
}

export function RankSelectorField({ field, value, onChange, disabled }: Props) {
  // If options declared, use them; otherwise pull public positions
  const declared = extractChoices(field.options);
  const shouldFetch = declared.length === 0;

  const { data: positions } = useQuery({
    queryKey: queryKeys.positions('all'),
    queryFn: async () => {
      const { data } = await api.get<PositionSummary[]>('/positions', {
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled: shouldFetch,
    staleTime: 60_000,
  });

  const choices = declared.length
    ? declared.map((c) => ({ value: c, label: c }))
    : (positions ?? []).map((p) => ({ value: p.slug, label: p.displayName }));

  return (
    <FieldShell field={field}>
      <select
        className="w-full rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm"
        value={value?.textValue ?? ''}
        disabled={disabled}
        onChange={(e) => onChange({ fieldId: field.id, textValue: e.target.value || null })}
      >
        <option value="">— выбрать ранг —</option>
        {choices.map((choice) => (
          <option key={choice.value} value={choice.value}>
            {choice.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
