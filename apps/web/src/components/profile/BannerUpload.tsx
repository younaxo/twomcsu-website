'use client';

import { Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { api, extractErrorMessage } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/profile';
import { cn } from '@/lib/utils';

interface BannerUploadProps {
  value: string | null;
  onChange: (banner: string | null, bannerPreset: string | null) => void;
}

export function BannerUpload({ value, onChange }: BannerUploadProps) {
  const [isBusy, setBusy] = useState(false);

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;

      const form = new FormData();
      form.append('file', file);
      setBusy(true);

      try {
        const { data } = await api.post<{ banner: string | null; bannerPreset: string | null }>(
          '/users/me/banner',
          form,
          { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        onChange(data.banner, data.bannerPreset);
        toast.success('Баннер обновлён');
      } catch (error) {
        toast.error(extractErrorMessage(error, 'Не удалось загрузить баннер'));
      } finally {
        setBusy(false);
      }
    },
    [onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'] },
    maxFiles: 1,
    disabled: isBusy,
  });

  const remove = async () => {
    setBusy(true);
    try {
      const { data } = await api.delete<{ banner: string | null; bannerPreset: string | null }>(
        '/users/me/banner',
      );
      onChange(data.banner, data.bannerPreset);
      toast.success('Баннер удалён');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось удалить баннер'));
    } finally {
      setBusy(false);
    }
  };

  const preview = resolveMediaUrl(value);

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          'relative flex h-36 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-secondary/40 transition-colors',
          isDragActive && 'border-primary bg-primary/10',
          isBusy && 'opacity-60',
        )}
      >
        <input {...getInputProps()} />
        {preview ? (
          <Image src={preview} alt="Баннер" fill className="object-cover" unoptimized />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="h-6 w-6" />
            <span className="text-sm">Перетащите баннер или нажмите</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">До 10 МБ, рекомендуется 1920×480</p>
        {value ? (
          <Button type="button" variant="ghost" size="sm" onClick={remove} disabled={isBusy}>
            <X className="h-4 w-4" />
            Удалить
          </Button>
        ) : null}
      </div>
    </div>
  );
}
