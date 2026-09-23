import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-12 w-full rounded-control border border-input bg-control-fill px-4 py-2 text-base text-foreground shadow-xs transition-[background-color,border-color,box-shadow] duration-fast ease-out file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground hover:border-border hover:bg-control-hover focus-visible:border-primary/60 focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/20 disabled:cursor-not-allowed disabled:bg-control-disabled disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/20 md:text-sm',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
