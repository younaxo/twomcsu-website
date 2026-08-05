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

function toEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) {
      return `https://www.youtube.com/embed/${u.searchParams.get('v')}`;
    }
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    return null;
  } catch {
    return null;
  }
}

export function VideoUrlField({ field, value, onChange, disabled }: Props) {
  const url = value?.textValue ?? '';
  const embed = url ? toEmbed(url) : null;

  return (
    <FieldShell field={field}>
      <Input
        type="url"
        value={url}
        placeholder={field.placeholder ?? 'https://youtube.com/...'}
        disabled={disabled}
        onChange={(e) => onChange({ fieldId: field.id, textValue: e.target.value })}
      />
      {embed ? (
        <div className="aspect-video overflow-hidden rounded-lg border border-white/10">
          <iframe
            src={embed}
            title="Video preview"
            className="h-full w-full"
            allowFullScreen
          />
        </div>
      ) : null}
    </FieldShell>
  );
}
