'use client';

import type { FormFieldDto } from '@twomc/shared';
import { X } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { extractErrorMessage } from '@/lib/api';
import { useUploadFormFile } from '@/hooks/forms';
import { FieldShell } from './field-shell';
import type { FieldValue } from '../types';

interface Props {
  field: FormFieldDto;
  slug: string;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
  disabled?: boolean;
}

export function FileUploadField({ field, slug, value, onChange, disabled }: Props) {
  const upload = useUploadFormFile(slug);
  const inputRef = useRef<HTMLInputElement>(null);
  const urls = value?.fileUrls ?? [];
  const maxFiles = field.maxFiles ?? 5;

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const available = Math.max(0, maxFiles - urls.length);
    if (available <= 0) {
      toast.error(`Максимум ${maxFiles} файлов`);
      return;
    }
    const list = Array.from(files).slice(0, available);
    try {
      const results = await Promise.all(list.map((file) => upload.mutateAsync(file)));
      onChange({
        fieldId: field.id,
        fileUrls: [...urls, ...results.map((r) => r.url)],
      });
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить'));
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (url: string) => {
    onChange({ fieldId: field.id, fileUrls: urls.filter((u) => u !== url) });
  };

  return (
    <FieldShell field={field}>
      <Input
        ref={inputRef}
        type="file"
        multiple={maxFiles > 1}
        accept={field.allowedMimes.join(',') || undefined}
        disabled={disabled || upload.isPending}
        onChange={(e) => void handleFiles(e.target.files)}
      />
      {urls.length ? (
        <ul className="space-y-1">
          {urls.map((url) => (
            <li
              key={url}
              className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.03] px-2 py-1 text-sm"
            >
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="truncate text-primary underline-offset-2 hover:underline"
              >
                {url.split('/').pop()}
              </a>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => remove(url)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-xs text-muted-foreground">
        До {maxFiles} файлов
        {field.maxFileSize ? `, размер до ${Math.round(field.maxFileSize / 1024 / 1024)} МБ` : ''}
      </p>
    </FieldShell>
  );
}
