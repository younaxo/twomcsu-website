'use client';

import type { FormFieldDto } from '@twomc/shared';
import { cn } from '@/lib/utils';
import { FieldShell } from './field-shell';
import type { FieldValue } from '../types';

interface Props {
  field: FormFieldDto;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
  disabled?: boolean;
}

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const HOURS = Array.from({ length: 24 }, (_, index) => index);

// jsonValue shape: { [day: string]: number[] }
export function SchedulePickerField({ field, value, onChange, disabled }: Props) {
  const raw =
    value?.jsonValue && typeof value.jsonValue === 'object' && !Array.isArray(value.jsonValue)
      ? (value.jsonValue as Record<string, number[]>)
      : {};

  const toggle = (day: string, hour: number) => {
    const list = raw[day] ?? [];
    const next = list.includes(hour) ? list.filter((h) => h !== hour) : [...list, hour].sort();
    onChange({ fieldId: field.id, jsonValue: { ...raw, [day]: next } });
  };

  return (
    <FieldShell field={field}>
      <div className="overflow-x-auto rounded-xl glass-medium p-3">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left text-muted-foreground"></th>
              {HOURS.map((h) => (
                <th key={h} className="w-6 pb-1 text-center text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day) => (
              <tr key={day}>
                <td className="pr-2 text-white">{day}</td>
                {HOURS.map((h) => {
                  const active = raw[day]?.includes(h) ?? false;
                  return (
                    <td key={h} className="p-0.5">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => toggle(day, h)}
                        className={cn(
                          'block h-5 w-5 rounded transition-colors',
                          active
                            ? 'bg-[#F57C00]'
                            : 'bg-white/[0.06] hover:bg-white/10',
                        )}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </FieldShell>
  );
}
