'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Download, ExternalLink, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export type ImagePreviewProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt?: string;
  gallery?: string[];
};

export function ImagePreview({
  open,
  onOpenChange,
  src,
  alt = 'Изображение',
  gallery,
}: ImagePreviewProps) {
  const images = gallery && gallery.length > 0 ? gallery : [src];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (open) {
      const nextIndex = images.indexOf(src);
      setIndex(nextIndex >= 0 ? nextIndex : 0);
    }
  }, [open, src, gallery]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        setIndex((current) => (current - 1 + images.length) % images.length);
      }
      if (event.key === 'ArrowRight') {
        setIndex((current) => (current + 1) % images.length);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, images.length]);

  const current = images[index] ?? src;
  const hasGallery = images.length > 1;

  const download = () => {
    const link = document.createElement('a');
    link.href = current;
    link.download = current.split('/').pop() || 'image';
    link.target = '_blank';
    link.rel = 'noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-h-[95vh] max-w-[95vw] border-none bg-transparent p-0 shadow-none',
          '[&>button]:hidden',
        )}
      >
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <div className="relative flex min-h-[50vh] items-center justify-center rounded-2xl bg-black/70 p-4 backdrop-blur-xl">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="absolute right-3 top-3 z-10 h-10 w-10 text-white hover:bg-white/10"
            onClick={() => onOpenChange(false)}
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="absolute left-3 top-3 z-10 flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="glass-medium"
              onClick={download}
            >
              <Download className="mr-1 h-4 w-4" />
              Скачать
            </Button>
            <Button type="button" size="sm" variant="secondary" className="glass-medium" asChild>
              <a href={current} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-1 h-4 w-4" />
                Открыть
              </a>
            </Button>
          </div>

          {hasGallery ? (
            <>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute left-2 top-1/2 z-10 h-12 w-12 -translate-y-1/2 text-white hover:bg-white/10"
                onClick={() => setIndex((current) => (current - 1 + images.length) % images.length)}
                aria-label="Предыдущее"
              >
                <ChevronLeft className="h-7 w-7" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute right-2 top-1/2 z-10 h-12 w-12 -translate-y-1/2 text-white hover:bg-white/10"
                onClick={() => setIndex((current) => (current + 1) % images.length)}
                aria-label="Следующее"
              >
                <ChevronRight className="h-7 w-7" />
              </Button>
            </>
          ) : null}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current}
            alt={alt}
            className="max-h-[85vh] max-w-[90vw] object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
