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

interface AvatarUploadProps {
  value: string | null;
  onChange: (avatar: string | null) => void;
}

export function AvatarUpload({ value, onChange }: AvatarUploadProps) {
  const [isBusy, setBusy] = useState(false);

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;

      const form = new FormData();
      form.append('file', file);
      setBusy(true);

      try {
        const { data } = await api.post<{ avatar: string | null }>('/users/me/avatar', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        onChange(data.avatar);
        toast.success('Аватар обновлён');
      } catch (error) {
        toast.error(extractErrorMessage(error, 'Не удалось загрузить аватар'));
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
      await api.delete('/users/me/avatar');
      onChange(null);
      toast.success('Аватар удалён');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось удалить аватар'));
    } finally {
      setBusy(false);
    }
  };

  const preview = resolveMediaUrl(value);

  return (
    <div className="flex items-center gap-4">
      <div
        {...getRootProps()}
        className={cn(
          'relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-secondary/40 transition-colors',
          isDragActive && 'border-primary bg-primary/10',
          isBusy && 'opacity-60',
        )}
      >
        <input {...getInputProps()} />
        {preview ? (
          <Image src={preview} alt="Аватар" fill className="object-cover" unoptimized />
        ) : (
          <Upload className="h-6 w-6 text-muted-foreground" />
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">JPEG, PNG, WEBP или GIF до 5 МБ</p>
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
