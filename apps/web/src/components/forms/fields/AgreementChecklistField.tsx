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

export function AgreementChecklistField({ field, value, onChange, disabled }: Props) {
  const items = extractChoices(field.options);
  const agreed = Array.isArray(value?.jsonValue)
    ? (value!.jsonValue as unknown[]).filter((v): v is string => typeof v === 'string')
    : [];

  const toggle = (item: string) => {
    const next = agreed.includes(item)
      ? agreed.filter((v) => v !== item)
      : [...agreed, item];
    onChange({ fieldId: field.id, jsonValue: next });
  };

  return (
    <FieldShell field={field}>
      <div className="space-y-2 rounded-xl glass-medium p-3">
        {items.map((item, index) => {
          const id = `${field.id}-ag-${index}`;
          return (
            <label key={item} htmlFor={id} className="flex items-start gap-2 text-sm">
              <Checkbox
                id={id}
                className="mt-0.5"
                checked={agreed.includes(item)}
                disabled={disabled}
                onCheckedChange={() => toggle(item)}
              />
              <span className="text-white">{item}</span>
            </label>
          );
        })}
        {!items.length ? (
          <p className="text-xs text-muted-foreground">Пункты не заданы</p>
        ) : null}
      </div>
    </FieldShell>
  );
}
