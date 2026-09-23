import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex min-h-6 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-[0.01em] transition-colors duration-fast ease-out focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-primary/25 bg-primary/15 text-primary hover:bg-primary/20',
        secondary: 'border-border bg-control-fill text-secondary-foreground hover:bg-control-hover',
        destructive: 'border-destructive/40 bg-destructive/15 text-destructive hover:bg-destructive/20',
        success: 'border-success/30 bg-success/15 text-success hover:bg-success/20',
        warning: 'border-warning/30 bg-warning/15 text-warning hover:bg-warning/20',
        info: 'border-info/30 bg-info/15 text-info hover:bg-info/20',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
