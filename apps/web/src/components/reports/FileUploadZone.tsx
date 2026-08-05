'use client';

import { FileText, ImageIcon, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DEFAULT_ACCEPT = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'video/mp4': ['.mp4'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
};

export function FileUploadZone({
  files,
  onChange,
  maxFiles = 10,
  accept = DEFAULT_ACCEPT,
  hint,
  className,
  disabled,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  accept?: Record<string, string[]>;
  hint?: string;
  className?: string;
  disabled?: boolean;
}) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      const next = [...files, ...accepted].slice(0, maxFiles);
      onChange(next);
    },
    [files, maxFiles, onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: Math.max(1, maxFiles - files.length),
    disabled: disabled || files.length >= maxFiles,
  });

  const removeAt = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-center transition',
          isDragActive && 'border-primary bg-primary/10',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 text-primary" />
        <p className="text-sm text-white">Перетащите файлы или нажмите для выбора</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>

      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map((file, index) => {
            const isImage = file.type.startsWith('image/');
            const preview = isImage ? URL.createObjectURL(file) : null;
            return (
              <li
                key={`${file.name}-${file.size}-${index}`}
                className="flex items-center gap-3 rounded-lg glass-light px-3 py-2"
              >
                {preview ? (
                  <Image
                    src={preview}
                    alt={file.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded object-cover"
                    unoptimized
                  />
                ) : file.type === 'application/pdf' ? (
                  <FileText className="h-8 w-8 text-red-400" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} КБ
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAt(index)}
                  aria-label="Удалить файл"
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
