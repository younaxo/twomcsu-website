'use client';

import { Laptop, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const options = [
  { value: 'system', icon: Laptop },
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations('theme');
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch: theme is only known client-side
  useEffect(() => setMounted(true), []);

  return (
    <div
      role="radiogroup"
      aria-label={t('label')}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-0.5',
        className,
      )}
    >
      {options.map(({ value, icon: Icon }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t(value)}
            title={t(value)}
            onClick={() => setTheme(value)}
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-[10px] text-muted-foreground transition-colors',
              active ? 'bg-white/[0.1] text-foreground' : 'hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
