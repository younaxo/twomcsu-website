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

export function NumberField({ field, value, onChange, disabled }: Props) {
  return (
    <FieldShell field={field}>
      <Input
        type="number"
        inputMode="decimal"
        value={value?.numberValue ?? ''}
        placeholder={field.placeholder ?? ''}
        min={field.minValue ?? undefined}
        max={field.maxValue ?? undefined}
        disabled={disabled}
        onChange={(e) => {
          const raw = e.target.value;
          const parsed = raw === '' ? null : Number(raw);
          onChange({
            fieldId: field.id,
            numberValue: parsed === null || Number.isNaN(parsed) ? null : parsed,
          });
        }}
      />
    </FieldShell>
  );
}
