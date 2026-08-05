'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  actions: React.ReactNode;
  className?: string;
  label?: string;
}

export function BulkActionsBar({
  selectedCount,
  onClear,
  actions,
  className,
  label,
}: BulkActionsBarProps) {
  if (selectedCount <= 0) return null;

  const countLabel =
    label ??
    `Выбрано: ${selectedCount.toLocaleString('ru-RU')} ${pluralizeSelected(selectedCount)}`;

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 z-50 flex w-[min(100%-2rem,48rem)] -translate-x-1/2 items-center gap-3 rounded-2xl glass-strong border border-white/10 px-4 py-3 shadow-lg',
        className,
      )}
      role="toolbar"
      aria-label="Массовые действия"
    >
      <span className="shrink-0 text-sm font-medium text-white">{countLabel}</span>
      <div className="flex flex-1 flex-wrap items-center justify-end gap-2">{actions}</div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={onClear}
        aria-label="Снять выделение"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

function pluralizeSelected(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'элемент';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'элемента';
  return 'элементов';
}
