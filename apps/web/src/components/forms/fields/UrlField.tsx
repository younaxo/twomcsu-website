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

export function UrlField({ field, value, onChange, disabled }: Props) {
  return (
    <FieldShell field={field}>
      <Input
        type="url"
        inputMode="url"
        value={value?.textValue ?? ''}
        placeholder={field.placeholder ?? 'https://'}
        disabled={disabled}
        onChange={(e) => onChange({ fieldId: field.id, textValue: e.target.value })}
      />
    </FieldShell>
  );
}
