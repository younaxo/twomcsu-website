'use client';

import type { FormFieldDto } from '@twomc/shared';
import { useMyPunishments } from '@/hooks/reports/useReports';
import { FieldShell } from './field-shell';
import type { FieldValue } from '../types';

interface Props {
  field: FormFieldDto;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
  disabled?: boolean;
}

export function PunishmentReferenceField({ field, value, onChange, disabled }: Props) {
  const { data } = useMyPunishments();
  const rows = data ?? [];

  return (
    <FieldShell field={field}>
      <select
        className="w-full rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm"
        value={value?.textValue ?? ''}
        disabled={disabled}
        onChange={(e) => onChange({ fieldId: field.id, textValue: e.target.value || null })}
      >
        <option value="">— выбрать наказание —</option>
        {rows.map((punishment) => (
          <option key={punishment.id} value={punishment.id}>
            {punishment.punishmentType} — {punishment.reason}
          </option>
        ))}
      </select>
      {!rows.length ? (
        <p className="text-xs text-muted-foreground">Наказания не найдены</p>
      ) : null}
    </FieldShell>
  );
}
