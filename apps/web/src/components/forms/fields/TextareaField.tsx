'use client';

import type { FormFieldDto } from '@twomc/shared';
import { Textarea } from '@/components/ui/textarea';
import { FieldShell } from './field-shell';
import type { FieldValue } from '../types';

interface Props {
  field: FormFieldDto;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
  disabled?: boolean;
}

export function TextareaField({ field, value, onChange, disabled }: Props) {
  const currentLength = (value?.textValue ?? '').length;
  return (
    <FieldShell field={field}>
      <Textarea
        value={value?.textValue ?? ''}
        placeholder={field.placeholder ?? ''}
        maxLength={field.maxLength ?? undefined}
        rows={5}
        disabled={disabled}
        onChange={(e) => onChange({ fieldId: field.id, textValue: e.target.value })}
      />
      {field.maxLength ? (
        <div className="text-right text-xs text-muted-foreground">
          {currentLength}/{field.maxLength}
        </div>
      ) : null}
    </FieldShell>
  );
}
