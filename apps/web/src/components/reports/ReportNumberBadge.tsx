'use client';

import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ReportNumberBadgeProps {
  reportNumber: string;
  className?: string;
}

export function ReportNumberBadge({ reportNumber, className }: ReportNumberBadgeProps) {
  const copy = async () => {
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
      onClick={() => void copy()}
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
