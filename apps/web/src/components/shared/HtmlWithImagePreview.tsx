'use client';

import { ImagePreview } from '@/components/shared/ImagePreview';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';

export function HtmlWithImagePreview({
  html,
  className,
  onContentClick,
}: {
  html: string;
  className?: string;
  onContentClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const gallery = useMemo(() => {
    if (typeof document === 'undefined') return [] as string[];
    const container = document.createElement('div');
    container.innerHTML = html;
    return Array.from(container.querySelectorAll('img'))
      .map((img) => img.getAttribute('src'))
      .filter((src): src is string => Boolean(src));
  }, [html]);

  return (
    <>
      <div
        className={cn('prose prose-invert max-w-none text-sm [&_img]:cursor-zoom-in', className)}
        dangerouslySetInnerHTML={{ __html: html }}
        onClick={(event) => {
          const target = event.target as HTMLElement | null;
          if (target?.tagName === 'IMG') {
            const src = (target as HTMLImageElement).currentSrc || (target as HTMLImageElement).src;
            if (src) {
              event.preventDefault();
              setPreviewSrc(src);
              return;
            }
          }
          onContentClick?.(event);
        }}
      />
      {previewSrc ? (
        <ImagePreview
          open={Boolean(previewSrc)}
          onOpenChange={(open) => {
            if (!open) setPreviewSrc(null);
          }}
          src={previewSrc}
          gallery={gallery}
        />
      ) : null}
    </>
  );
}
