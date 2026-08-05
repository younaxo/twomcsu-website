'use client';

import type { FormFieldDto } from '@twomc/shared';
import { MarkdownEditor } from '@/components/shared/MarkdownEditor';
import { FieldShell } from './field-shell';
import type { FieldValue } from '../types';

interface Props {
  field: FormFieldDto;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
  disabled?: boolean;
}

export function MarkdownField({ field, value, onChange, disabled }: Props) {
  return (
    <FieldShell field={field}>
      <MarkdownEditor
        value={value?.textValue ?? ''}
        onChange={(next) => onChange({ fieldId: field.id, textValue: next })}
        placeholder={field.placeholder ?? 'Markdown...'}
        maxLength={field.maxLength ?? undefined}
        disabled={disabled}
      />
    </FieldShell>
  );
}
