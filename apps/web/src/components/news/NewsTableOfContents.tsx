'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { extractToc } from './NewsContent';

interface NewsTableOfContentsProps {
  items: ReturnType<typeof extractToc>;
}

export function NewsTableOfContents({ items }: NewsTableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (!items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) {
          setActiveId(visible.target.id);
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5, 1] },
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  if (!items.length) return null;

  return (
    <nav className="rounded-2xl glass-medium p-4">
      <p className="mb-3 text-sm font-semibold text-white">Содержание</p>
      <ul className="space-y-1.5 text-sm">
        {items.map((item) => (
          <li key={item.id} className={cn(item.level === 3 && 'pl-3')}>
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={cn(
                'block transition-opacity hover:opacity-80',
                activeId === item.id ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
