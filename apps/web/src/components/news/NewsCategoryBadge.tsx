'use client';

import { NEWS_CATEGORY_COLORS, NEWS_CATEGORY_LABELS, type NewsCategory } from '@twomc/shared';
import { cn } from '@/lib/utils';

interface NewsCategoryBadgeProps {
  category: NewsCategory;
  className?: string;
}

export function NewsCategoryBadge({ category, className }: NewsCategoryBadgeProps) {
  const color = NEWS_CATEGORY_COLORS[category];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-white',
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {NEWS_CATEGORY_LABELS[category]}
    </span>
  );
}
