'use client';

import { Eye, EyeOff } from 'lucide-react';
import * as React from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, 'type'>;

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [isVisible, setVisible] = React.useState(false);

    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          type={isVisible ? 'text' : 'password'}
          className={cn('pr-12', className)}
        />

        <button
          type="button"
          onClick={() => setVisible((visible) => !visible)}
          disabled={props.disabled}
          aria-label={isVisible ? 'Скрыть пароль' : 'Показать пароль'}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-control text-muted-foreground transition-colors duration-fast ease-out hover:bg-control-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50"
        >
          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
