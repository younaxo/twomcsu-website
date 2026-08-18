import { MessageCircleMore } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileStatusProps {
  status: string | null | undefined;
  compact?: boolean;
  className?: string;
}

export function ProfileStatus({ status, compact = false, className }: ProfileStatusProps) {
  if (!status) return null;

  return (
    <div
      className={cn(
        'inline-flex max-w-full items-start gap-2.5 rounded-2xl border border-white/10 bg-white/[0.045] text-left shadow-sm backdrop-blur-md',
        compact ? 'px-2.5 py-2' : 'px-3.5 py-2.5',
        className,
      )}
    >
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <MessageCircleMore className="h-3.5 w-3.5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/80">
          Статус
        </span>
        <span className={cn('block break-words text-foreground', compact ? 'text-xs' : 'text-sm')}>
          {status}
        </span>
      </span>
    </div>
  );
}
