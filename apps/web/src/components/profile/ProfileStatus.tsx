import { Quote, Sparkles } from 'lucide-react';
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
        'relative max-w-full overflow-hidden border text-left shadow-sm backdrop-blur-md',
        compact
          ? 'inline-flex items-start gap-2.5 rounded-2xl border-white/10 bg-white/[0.045] px-2.5 py-2'
          : 'flex items-center gap-3 rounded-2xl border-primary/20 bg-gradient-to-r from-primary/[0.12] via-white/[0.045] to-transparent px-4 py-3.5',
        className,
      )}
    >
      {!compact ? <span className="absolute inset-y-0 left-0 w-0.5 bg-primary" /> : null}
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary',
          compact ? 'mt-0.5 h-6 w-6' : 'h-9 w-9',
        )}
      >
        {compact ? (
          <Quote className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <Sparkles className="h-4 w-4" aria-hidden />
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/80">
          {compact ? 'Статус' : 'Сейчас'}
        </span>
        <span
          className={cn(
            'block break-words text-foreground',
            compact ? 'text-xs' : 'mt-0.5 text-[15px] font-medium leading-snug',
          )}
        >
          {status}
        </span>
      </span>
    </div>
  );
}
