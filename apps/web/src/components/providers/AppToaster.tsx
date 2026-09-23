'use client';

import { useTheme } from 'next-themes';
import { Toaster } from 'sonner';

/** Keeps sonner's toast palette in sync with the active theme (next-themes) */
export function AppToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      theme={(resolvedTheme as 'light' | 'dark') ?? 'dark'}
      position="bottom-center"
      visibleToasts={3}
      duration={4200}
      gap={12}
      toastOptions={{
        classNames: {
          toast: 'group toast glass-menu rounded-card text-foreground',
          title: 'text-sm font-semibold',
          description: 'text-[13px] font-medium text-muted-foreground',
        },
      }}
    />
  );
}
