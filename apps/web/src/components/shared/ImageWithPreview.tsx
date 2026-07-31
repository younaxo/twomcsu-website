'use client';

import { ImagePreview } from '@/components/shared/ImagePreview';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function ImageWithPreview({
  src,
  alt = '',
  className,
  gallery,
  imgClassName,
}: {
  src: string;
  alt?: string;
  className?: string;
  gallery?: string[];
  imgClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  if (!src) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn('block overflow-hidden text-left', className)}
        aria-label={alt || 'Открыть изображение'}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={cn('h-full w-full object-cover', imgClassName)} />
      </button>
      <ImagePreview
        open={open}
        onOpenChange={setOpen}
        src={src}
        alt={alt}
        gallery={gallery}
      />
    </>
  );
}
