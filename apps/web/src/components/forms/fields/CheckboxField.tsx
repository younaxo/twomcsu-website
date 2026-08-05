'use client';

import type { FormFieldDto } from '@twomc/shared';
import { Checkbox } from '@/components/ui/checkbox';
import { extractChoices } from '../field-types';
import { FieldShell } from './field-shell';
import type { FieldValue } from '../types';

interface Props {
  field: FormFieldDto;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
  disabled?: boolean;
}

export function CheckboxField({ field, value, onChange, disabled }: Props) {
  const choices = extractChoices(field.options);
  const selected = Array.isArray(value?.jsonValue)
    ? (value!.jsonValue as unknown[]).filter((v): v is string => typeof v === 'string')
    : [];

  const toggle = (choice: string) => {
    const next = selected.includes(choice)
      ? selected.filter((v) => v !== choice)
      : [...selected, choice];
    onChange({ fieldId: field.id, jsonValue: next });
  };

  return (
    <FieldShell field={field}>
      <div className="space-y-1">
        {choices.map((choice, index) => {
          const inputId = `${field.id}-cb-${index}`;
          return (
            <label key={choice} htmlFor={inputId} className="flex items-center gap-2 text-sm">
              <Checkbox
                id={inputId}
                checked={selected.includes(choice)}
                disabled={disabled}
                onCheckedChange={() => toggle(choice)}
              />
              <span className="text-white">{choice}</span>
            </label>
          );
        })}
        {!choices.length ? (
          <p className="text-xs text-muted-foreground">Варианты не заданы</p>
        ) : null}
      </div>
    </FieldShell>
  );
}
