'use client';

import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AdminFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  onReset?: () => void;
  className?: string;
}

export function AdminFilters({
  search,
  onSearchChange,
  searchPlaceholder = 'Поиск…',
  filters,
  onReset,
  className,
}: AdminFiltersProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card/40 p-4',
        className,
      )}
    >
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      {filters}
      {onReset ? (
        <Button type="button" variant="secondary" onClick={onReset}>
          <X className="mr-1.5 h-4 w-4" />
          Сбросить фильтры
        </Button>
      ) : null}
    </div>
  );
}
