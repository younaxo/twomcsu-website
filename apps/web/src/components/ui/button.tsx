import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control text-sm font-semibold tracking-[-0.01em] transition-[background-color,border-color,color,box-shadow] duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/55 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'border border-primary/80 bg-primary text-primary-foreground shadow-[0_1px_0_rgba(255,255,255,0.14)_inset,0_6px_18px_rgba(0,0,0,0.18)] hover:border-primary-hover hover:bg-primary-hover active:border-primary-active active:bg-primary-active',
        destructive:
          'border border-destructive-solid bg-destructive-solid text-destructive-foreground shadow-sm hover:bg-destructive-solid/88 active:bg-destructive-solid/95',
        outline:
          'border border-border bg-transparent text-foreground shadow-xs hover:border-primary/40 hover:bg-control-hover active:bg-control-active',
        secondary:
          'border border-border bg-control-fill text-secondary-foreground shadow-xs hover:bg-control-hover active:bg-control-active',
        ghost: 'text-muted-foreground hover:bg-control-hover hover:text-foreground active:bg-control-active',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-4 py-2.5',
        sm: 'h-9 rounded-[calc(var(--radius-control)-2px)] px-3 text-sm',
        lg: 'h-12 rounded-[calc(var(--radius-control)+2px)] px-6 text-[15px]',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Spinner = () => (
  <svg className="size-4 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.37 0 0 5.37 0 12h4Z" />
  </svg>
);

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <Spinner /> : null}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
