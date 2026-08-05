'use client';

import type { FormFieldDto } from '@twomc/shared';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { extractChoices } from '../field-types';
import { FieldShell } from './field-shell';
import type { FieldValue } from '../types';

interface Props {
  field: FormFieldDto;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
  disabled?: boolean;
}

export function RadioField({ field, value, onChange, disabled }: Props) {
  const choices = extractChoices(field.options);
  const current = value?.textValue ?? '';

  return (
    <FieldShell field={field}>
      <RadioGroup
        value={current}
        disabled={disabled}
        onValueChange={(next) => onChange({ fieldId: field.id, textValue: next })}
        className="space-y-1"
      >
        {choices.map((choice, index) => {
          const inputId = `${field.id}-radio-${index}`;
          return (
            <div key={choice} className="flex items-center gap-2">
              <RadioGroupItem id={inputId} value={choice} />
              <label htmlFor={inputId} className="cursor-pointer text-sm text-white">
                {choice}
              </label>
            </div>
          );
        })}
        {!choices.length ? (
          <p className="text-xs text-muted-foreground">Варианты не заданы</p>
        ) : null}
      </RadioGroup>
    </FieldShell>
  );
}
