'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface NewsTagsListProps {
  tags: string[];
  activeTag?: string | null;
  className?: string;
}

export function NewsTagsList({ tags, activeTag, className }: NewsTagsListProps) {
  if (!tags.length) return null;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {tags.map((tag) => {
        const active = activeTag === tag;
        return (
          <Link
            key={tag}
            href={`/news?tag=${encodeURIComponent(tag)}`}
            className={cn(
              'rounded-md border px-2.5 py-1 text-xs transition-opacity hover:opacity-80',
              active
                ? 'border-primary/50 bg-primary/15 text-primary'
                : 'border-border bg-secondary/40 text-muted-foreground',
            )}
          >
            #{tag}
          </Link>
        );
      })}
    </div>
  );
}
