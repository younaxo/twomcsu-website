'use client';

import type { FormFieldDto } from '@twomc/shared';
import { extractChoices } from '../field-types';
import { FieldShell } from './field-shell';
import type { FieldValue } from '../types';

interface Props {
  field: FormFieldDto;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
  disabled?: boolean;
}

// No achievements endpoint yet — use options as declared list or show empty state
export function AchievementSelectorField({ field, value, onChange, disabled }: Props) {
  const choices = extractChoices(field.options);
  return (
    <FieldShell field={field}>
      {choices.length ? (
        <select
          className="w-full rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm"
          value={value?.textValue ?? ''}
          disabled={disabled}
          onChange={(e) => onChange({ fieldId: field.id, textValue: e.target.value || null })}
        >
          <option value="">— выбрать достижение —</option>
          {choices.map((choice) => (
            <option key={choice} value={choice}>
              {choice}
            </option>
          ))}
        </select>
      ) : (
        <p className="text-xs text-muted-foreground">
          Список достижений скоро появится
        </p>
      )}
    </FieldShell>
  );
}
