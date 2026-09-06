import * as React from 'react';

import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[112px] w-full rounded-xl border border-white/[0.1] bg-white/[0.045] px-4 py-3 text-base text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] transition-[background-color,border-color,box-shadow] duration-200 placeholder:text-neutral-500 hover:border-white/[0.15] focus-visible:border-primary/55 focus-visible:bg-white/[0.065] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:bg-white/[0.025] disabled:opacity-50 md:text-sm',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
