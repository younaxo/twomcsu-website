'use client';

import type { StoreCategory } from '@twomc/shared';
import { ChevronRight, FolderTree } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CategoryTreeProps {
  categories: StoreCategory[];
  activeSlug: string | null;
  onSelect: (slug: string | null) => void;
  className?: string;
}

function CategoryNode({
  category,
  activeSlug,
  onSelect,
  depth = 0,
}: {
  category: StoreCategory;
  activeSlug: string | null;
  onSelect: (slug: string | null) => void;
  depth?: number;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = category.subcategories.length > 0;
  const active = activeSlug === category.slug;

  return (
    <div>
      <button
        type="button"
        className={cn(
          'flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent',
          active && 'bg-primary/15 text-primary',
        )}
        style={{ paddingLeft: 8 + depth * 12 }}
        onClick={() => onSelect(active ? null : category.slug)}
      >
        {hasChildren ? (
          <ChevronRight
            className={cn('h-3.5 w-3.5 shrink-0 transition-transform', open && 'rotate-90')}
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
          />
        ) : (
          <span className="w-3.5" />
        )}
        <span className="truncate">{category.name}</span>
      </button>

      {hasChildren && open
        ? category.subcategories.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              activeSlug={activeSlug}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))
        : null}
    </div>
  );
}

export function CategoryTree({
  categories,
  activeSlug,
  onSelect,
  className,
}: CategoryTreeProps) {
  return (
    <nav className={cn('space-y-1', className)}>
      <button
        type="button"
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent',
          !activeSlug && 'bg-primary/15 text-primary',
        )}
        onClick={() => onSelect(null)}
      >
        <FolderTree className="h-3.5 w-3.5" />
        Все товары
      </button>
      {categories.map((category) => (
        <CategoryNode
          key={category.id}
          category={category}
          activeSlug={activeSlug}
          onSelect={onSelect}
        />
      ))}
    </nav>
  );
}
