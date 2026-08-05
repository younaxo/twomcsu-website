'use client';

import type { FormFieldDto } from '@twomc/shared';
import { Input } from '@/components/ui/input';
import { FieldShell } from './field-shell';
import type { FieldValue } from '../types';

interface Props {
  field: FormFieldDto;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
  disabled?: boolean;
}

export function DateField({ field, value, onChange, disabled }: Props) {
  const iso = value?.dateValue ?? '';
  const dateOnly = iso ? iso.slice(0, 10) : '';
  return (
    <FieldShell field={field}>
      <Input
        type="date"
        value={dateOnly}
        disabled={disabled}
        onChange={(e) => {
          const v = e.target.value;
          onChange({ fieldId: field.id, dateValue: v ? `${v}T00:00:00.000Z` : null });
        }}
      />
    </FieldShell>
  );
}
