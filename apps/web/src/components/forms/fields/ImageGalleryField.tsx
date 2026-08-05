'use client';

import type { FormFieldDto } from '@twomc/shared';
import { X } from 'lucide-react';
import Image from 'next/image';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { extractErrorMessage } from '@/lib/api';
import { useUploadFormFile } from '@/hooks/forms';
import { cn } from '@/lib/utils';
import { FieldShell } from './field-shell';
import type { FieldValue } from '../types';

interface Props {
  field: FormFieldDto;
  slug: string;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
  disabled?: boolean;
}

export function ImageGalleryField({ field, slug, value, onChange, disabled }: Props) {
  const upload = useUploadFormFile(slug);
  const urls = value?.fileUrls ?? [];
  const maxFiles = field.maxFiles ?? 10;

  const onDrop = useCallback(
    async (files: File[]) => {
      const available = Math.max(0, maxFiles - urls.length);
      if (available <= 0) {
        toast.error(`Максимум ${maxFiles} изображений`);
        return;
      }
      const list = files.slice(0, available);
      try {
        const results = await Promise.all(list.map((file) => upload.mutateAsync(file)));
        onChange({
          fieldId: field.id,
          fileUrls: [...urls, ...results.map((r) => r.url)],
        });
      } catch (error) {
        toast.error(extractErrorMessage(error, 'Не удалось загрузить'));
      }
    },
    [field.id, maxFiles, onChange, upload, urls],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => void onDrop(files),
    accept: { 'image/*': [] },
    disabled: disabled || upload.isPending,
    multiple: true,
  });

  const remove = (url: string) => {
    onChange({ fieldId: field.id, fileUrls: urls.filter((u) => u !== url) });
  };

  return (
    <FieldShell field={field}>
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-muted-foreground transition-colors',
          isDragActive && 'border-[#F57C00] bg-[#F57C00]/5',
        )}
      >
        <input {...getInputProps()} />
        <p>Перетащите изображения или нажмите для выбора</p>
        <p className="text-xs">До {maxFiles} шт.</p>
      </div>
      {urls.length ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {urls.map((url) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-lg">
              <Image src={url} alt="" fill className="object-cover" unoptimized />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => remove(url)}
                disabled={disabled}
                className="absolute right-1 top-1 h-6 w-6 rounded-full bg-neutral-900/80"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </FieldShell>
  );
}
