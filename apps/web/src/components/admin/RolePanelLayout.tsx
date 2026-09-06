'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type PanelNavLink = {
  href: string;
  label: string;
};

type RolePanelLayoutProps = {
  title: string;
  links: PanelNavLink[];
  children: React.ReactNode;
  variant?: 'horizontal' | 'sidebar';
  headerExtra?: React.ReactNode;
};

export function RolePanelLayout({
  title,
  links,
  children,
  variant = 'horizontal',
  headerExtra,
}: RolePanelLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  if (variant === 'sidebar') {
    return (
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        <div className="glass-panel frame-corners flex items-center justify-between rounded-2xl p-4 lg:hidden">
          <h1 className="text-lg font-semibold text-white">{title}</h1>
          <div className="flex items-center gap-2">
            {headerExtra}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={sidebarOpen ? 'Закрыть меню' : 'Открыть меню'}
              onClick={() => setSidebarOpen((open) => !open)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <aside
          className={cn(
            'glass-panel frame-corners w-full shrink-0 rounded-2xl p-3 lg:sticky lg:top-24 lg:block lg:w-60 xl:w-64',
            sidebarOpen ? 'block' : 'hidden lg:block',
          )}
        >
          <div className="mb-4 hidden border-b border-white/[0.07] px-2 pb-4 lg:block">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              Панель
            </p>
            <h1 className="text-lg font-semibold text-white">{title}</h1>
          </div>
          <nav className="flex max-h-[70vh] flex-col gap-1 overflow-y-auto">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-sm transition-colors hover:bg-white/[0.06]',
                  isActive(link.href)
                    ? 'border-primary/25 bg-primary/10 text-primary'
                    : 'border-transparent text-muted-foreground',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 hidden items-center justify-end gap-2 lg:flex">{headerExtra}</div>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel frame-corners rounded-2xl p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-white">{title}</h1>
          {headerExtra}
        </div>
        <nav className="flex flex-wrap gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-white/[0.06]',
                isActive(link.href)
                  ? 'border-primary/25 bg-primary/10 text-primary'
                  : 'border-transparent text-muted-foreground',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
