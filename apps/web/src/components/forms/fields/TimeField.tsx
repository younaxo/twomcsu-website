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

export function TimeField({ field, value, onChange, disabled }: Props) {
  return (
    <FieldShell field={field}>
      <Input
        type="time"
        value={value?.textValue ?? ''}
        disabled={disabled}
        onChange={(e) => onChange({ fieldId: field.id, textValue: e.target.value || null })}
      />
    </FieldShell>
  );
}
