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

export function ColorPickerField({ field, value, onChange, disabled }: Props) {
  const current = value?.textValue ?? '#F57C00';
  return (
    <FieldShell field={field}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={current}
          disabled={disabled}
          onChange={(e) => onChange({ fieldId: field.id, textValue: e.target.value })}
          className="h-9 w-14 cursor-pointer rounded-md border border-input bg-transparent"
        />
        <Input
          value={current}
          disabled={disabled}
          maxLength={7}
          onChange={(e) => onChange({ fieldId: field.id, textValue: e.target.value })}
          className="max-w-[140px] font-mono"
        />
      </div>
    </FieldShell>
  );
}
