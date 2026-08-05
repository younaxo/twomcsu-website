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

interface RangeValue {
  from?: string;
  to?: string;
}

export function DateRangeField({ field, value, onChange, disabled }: Props) {
  const raw =
    value?.jsonValue && typeof value.jsonValue === 'object' && !Array.isArray(value.jsonValue)
      ? (value.jsonValue as RangeValue)
      : {};

  const update = (patch: RangeValue) => {
    onChange({
      fieldId: field.id,
      jsonValue: { ...raw, ...patch },
    });
  };

  return (
    <FieldShell field={field}>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">С</span>
          <Input
            type="date"
            value={raw.from ?? ''}
            disabled={disabled}
            onChange={(e) => update({ from: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">По</span>
          <Input
            type="date"
            value={raw.to ?? ''}
            disabled={disabled}
            onChange={(e) => update({ to: e.target.value })}
          />
        </div>
      </div>
    </FieldShell>
  );
}
