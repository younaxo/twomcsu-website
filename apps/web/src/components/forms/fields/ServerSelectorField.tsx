'use client';

import type { FormFieldDto } from '@twomc/shared';
import { useServers } from '@/hooks/servers';
import { FieldShell } from './field-shell';
import type { FieldValue } from '../types';

interface Props {
  field: FormFieldDto;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
  disabled?: boolean;
}

export function ServerSelectorField({ field, value, onChange, disabled }: Props) {
  const { data } = useServers();
  return (
    <FieldShell field={field}>
      <select
        className="w-full rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm"
        value={value?.textValue ?? ''}
        disabled={disabled}
        onChange={(e) => onChange({ fieldId: field.id, textValue: e.target.value || null })}
      >
        <option value="">— выбрать сервер —</option>
        {(data ?? []).map((server) => (
          <option key={server.id} value={server.slug}>
            {server.name}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
