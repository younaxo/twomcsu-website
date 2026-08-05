'use client';

import type { FormFieldDto } from '@twomc/shared';
import { useTopics } from '@/hooks/useTopics';
import { FieldShell } from './field-shell';
import type { FieldValue } from '../types';

interface Props {
  field: FormFieldDto;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
  disabled?: boolean;
}

export function TopicReferenceField({ field, value, onChange, disabled }: Props) {
  const { data } = useTopics({ page: 1, limit: 50 });
  const rows = data?.data ?? [];

  return (
    <FieldShell field={field}>
      <select
        className="w-full rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm"
        value={value?.textValue ?? ''}
        disabled={disabled}
        onChange={(e) => onChange({ fieldId: field.id, textValue: e.target.value || null })}
      >
        <option value="">— выбрать тему —</option>
        {rows.map((topic) => (
          <option key={topic.id} value={topic.slug}>
            {topic.title}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
