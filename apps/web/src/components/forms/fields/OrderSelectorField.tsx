'use client';

import type { FormFieldDto } from '@twomc/shared';
import { useOrders } from '@/hooks/store/useOrders';
import { FieldShell } from './field-shell';
import type { FieldValue } from '../types';

interface Props {
  field: FormFieldDto;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
  disabled?: boolean;
}

export function OrderSelectorField({ field, value, onChange, disabled }: Props) {
  const { data } = useOrders(1, 50);
  const orders = data?.items ?? [];

  return (
    <FieldShell field={field}>
      <select
        className="w-full rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm"
        value={value?.textValue ?? ''}
        disabled={disabled}
        onChange={(e) => onChange({ fieldId: field.id, textValue: e.target.value || null })}
      >
        <option value="">— выбрать заказ —</option>
        {orders.map((order) => (
          <option key={order.id} value={order.orderNumber}>
            #{order.orderNumber}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
