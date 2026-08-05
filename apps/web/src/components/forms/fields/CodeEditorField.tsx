'use client';

import type { FormFieldDto } from '@twomc/shared';
import { FieldShell } from './field-shell';
import type { FieldValue } from '../types';

interface Props {
  field: FormFieldDto;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
  disabled?: boolean;
}

// Simple monospace textarea; Monaco not installed in web app
export function CodeEditorField({ field, value, onChange, disabled }: Props) {
  const language =
    field.metadata && typeof field.metadata === 'object' && 'language' in field.metadata
      ? String((field.metadata as { language?: unknown }).language ?? '')
      : '';

  return (
    <FieldShell field={field}>
      <div className="overflow-hidden rounded-xl glass-medium">
        {language ? (
          <div className="flex items-center justify-between border-b border-white/5 px-3 py-1.5 text-xs text-muted-foreground">
            <span className="font-mono uppercase tracking-wide">{language}</span>
          </div>
        ) : null}
        <textarea
          value={value?.textValue ?? ''}
          disabled={disabled}
          onChange={(e) => onChange({ fieldId: field.id, textValue: e.target.value })}
          spellCheck={false}
          className="min-h-[200px] w-full resize-y bg-transparent px-3 py-2 font-mono text-sm outline-none"
          placeholder={field.placeholder ?? '// code'}
        />
      </div>
    </FieldShell>
  );
}
