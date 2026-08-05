'use client';

import type { FormFieldDto } from '@twomc/shared';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FieldShell } from './field-shell';
import type { FieldValue } from '../types';

interface Props {
  field: FormFieldDto;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
  disabled?: boolean;
}

export function RatingField({ field, value, onChange, disabled }: Props) {
  const max = field.maxValue ?? 5;
  const current = Number(value?.numberValue ?? 0);

  return (
    <FieldShell field={field}>
      <div className="flex items-center gap-1">
        {Array.from({ length: max }).map((_, index) => {
          const star = index + 1;
          const active = current >= star;
          return (
            <button
              key={star}
              type="button"
              disabled={disabled}
              aria-label={`${star}`}
              onClick={() => onChange({ fieldId: field.id, numberValue: star })}
              className="rounded-md p-1 transition-colors hover:bg-white/10 disabled:cursor-not-allowed"
            >
              <Star
                className={cn(
                  'h-6 w-6 transition-colors',
                  active ? 'fill-[#F57C00] text-[#F57C00]' : 'text-muted-foreground',
                )}
              />
            </button>
          );
        })}
        {current > 0 ? (
          <span className="ml-2 text-sm text-muted-foreground">{current}/{max}</span>
        ) : null}
      </div>
    </FieldShell>
  );
}
