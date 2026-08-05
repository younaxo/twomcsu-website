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

// Simple +7 mask: strips non-digits, formats as +7 (XXX) XXX-XX-XX
function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  let core = digits;
  if (core.startsWith('8')) core = `7${core.slice(1)}`;
  if (!core.startsWith('7')) core = `7${core}`;
  core = core.slice(0, 11);

  const parts = ['+7'];
  if (core.length > 1) parts.push(` (${core.slice(1, 4)}`);
  if (core.length >= 4) parts.push(`)`);
  if (core.length >= 5) parts.push(` ${core.slice(4, 7)}`);
  if (core.length >= 8) parts.push(`-${core.slice(7, 9)}`);
  if (core.length >= 10) parts.push(`-${core.slice(9, 11)}`);
  return parts.join('');
}

export function PhoneField({ field, value, onChange, disabled }: Props) {
  return (
    <FieldShell field={field}>
      <Input
        type="tel"
        inputMode="tel"
        value={value?.textValue ?? ''}
        placeholder={field.placeholder ?? '+7 (___) ___-__-__'}
        disabled={disabled}
        onChange={(e) => onChange({ fieldId: field.id, textValue: formatPhone(e.target.value) })}
      />
    </FieldShell>
  );
}
