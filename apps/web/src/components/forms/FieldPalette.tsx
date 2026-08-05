'use client';

import { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  ALL_FIELD_TYPES,
  FIELD_CATEGORIES,
  FIELD_TYPE_META,
  type FieldTypeMeta,
} from './field-types';

interface Props {
  onAdd: (type: FieldTypeMeta['type']) => void;
}

export function FieldPalette({ onAdd }: Props) {
  const [openCategory, setOpenCategory] = useState<FieldTypeMeta['category']>('standard');
  const categories = FIELD_CATEGORIES;

  const grouped = categories.map((category) => ({
    ...category,
    items: ALL_FIELD_TYPES.filter((type) => FIELD_TYPE_META[type].category === category.key),
  }));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {grouped.map((category) => (
          <button
            key={category.key}
            type="button"
            onClick={() => setOpenCategory(category.key)}
            className={cn(
              'rounded-full px-3 py-1 text-xs transition-colors',
              openCategory === category.key
                ? 'bg-[#F57C00] text-white'
                : 'bg-white/[0.05] text-muted-foreground hover:bg-white/10',
            )}
          >
            {category.labelRu}
          </button>
        ))}
      </div>
      <TooltipProvider delayDuration={200}>
        <div className="grid grid-cols-2 gap-1.5">
          {grouped
            .find((category) => category.key === openCategory)
            ?.items.map((type) => {
              const meta = FIELD_TYPE_META[type];
              const Icon = meta.icon;
              return (
                <Tooltip key={type}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onAdd(type)}
                      className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] p-2 text-left text-xs text-white transition-colors hover:bg-white/10"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate">{meta.labelRu}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{meta.description}</TooltipContent>
                </Tooltip>
              );
            })}
        </div>
      </TooltipProvider>
    </div>
  );
}
