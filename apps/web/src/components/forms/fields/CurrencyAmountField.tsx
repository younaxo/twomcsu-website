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

export function CurrencyAmountField({ field, value, onChange, disabled }: Props) {
  const currency =
    field.metadata && typeof field.metadata === 'object' && 'currency' in field.metadata
      ? String((field.metadata as { currency?: unknown }).currency ?? '₽')
      : '₽';

  return (
    <FieldShell field={field}>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          inputMode="decimal"
          value={value?.numberValue ?? ''}
          placeholder={field.placeholder ?? '0'}
          min={field.minValue ?? 0}
          max={field.maxValue ?? undefined}
          disabled={disabled}
          onChange={(e) => {
            const raw = e.target.value;
            const parsed = raw === '' ? null : Number(raw);
            onChange({
              fieldId: field.id,
              numberValue: parsed === null || Number.isNaN(parsed) ? null : parsed,
            });
          }}
        />
        <span className="text-sm text-muted-foreground">{currency}</span>
      </div>
    </FieldShell>
  );
}
