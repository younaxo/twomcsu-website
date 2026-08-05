'use client';

import type { FormFieldDto } from '@twomc/shared';
import { useProducts } from '@/hooks/store';
import { FieldShell } from './field-shell';
import type { FieldValue } from '../types';

interface Props {
  field: FormFieldDto;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
  disabled?: boolean;
}

export function ProductSelectorField({ field, value, onChange, disabled }: Props) {
  const { data } = useProducts({ limit: 100 });
  const products = data?.items ?? [];

  return (
    <FieldShell field={field}>
      <select
        className="w-full rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm"
        value={value?.textValue ?? ''}
        disabled={disabled}
        onChange={(e) => onChange({ fieldId: field.id, textValue: e.target.value || null })}
      >
        <option value="">— выбрать товар —</option>
        {products.map((product) => (
          <option key={product.id} value={product.slug}>
            {product.name}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
