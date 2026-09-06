import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[11px] text-sm font-semibold tracking-[-0.01em] transition-[background-color,border-color,color,box-shadow,opacity] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/55 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'border border-primary/80 bg-primary text-white shadow-[0_1px_0_rgba(255,255,255,0.14)_inset,0_6px_18px_rgba(0,0,0,0.18)] hover:border-primary-hover hover:bg-primary-hover',
        destructive:
          'border border-destructive bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/88',
        outline:
          'border border-white/[0.12] bg-white/[0.045] text-foreground shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] hover:border-white/[0.18] hover:bg-white/[0.075]',
        secondary:
          'border border-white/[0.08] bg-white/[0.075] text-secondary-foreground shadow-sm hover:border-white/[0.12] hover:bg-white/[0.11]',
        ghost: 'text-muted-foreground hover:bg-white/[0.065] hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-4 py-2.5',
        sm: 'h-9 rounded-[9px] px-3 text-sm',
        lg: 'h-12 rounded-xl px-6 text-[15px]',
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
