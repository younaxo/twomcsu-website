'use client';

import { Copy } from 'lucide-react';
import type { MouseEvent } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ReportNumberBadgeProps {
  reportNumber: string;
  className?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function ReportNumberBadge({ reportNumber, className, onClick }: ReportNumberBadgeProps) {
  const copy = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onClick?.(event);

    try {
      await navigator.clipboard.writeText(reportNumber);
      toast.success(`Скопировано: ${reportNumber}`);
    } catch {
      toast.error('Не удалось скопировать номер');
    }
  };

  return (
    <button
      type="button"
      onClick={(event) => void copy(event)}
      title="Скопировать номер обращения"
      className={cn(
        'group inline-flex items-center gap-1.5 rounded-md font-mono text-sm text-foreground/90 transition-opacity hover:opacity-80',
        className,
      )}
    >
      <span>{reportNumber}</span>
      <Copy className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
    </button>
  );
}
