'use client';

import type { NewsSummary } from '@twomc/shared';
import { NewsCard } from './NewsCard';

interface NewsRelatedProps {
  items: NewsSummary[];
}

export function NewsRelated({ items }: NewsRelatedProps) {
  if (!items.length) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Читайте также</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <NewsCard key={item.id} news={item} compact />
        ))}
      </div>
    </section>
  );
}
