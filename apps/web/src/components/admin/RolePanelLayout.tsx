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

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  if (variant === 'sidebar') {
    return (
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        <div className="glass-panel flex items-center justify-between rounded-2xl p-4 lg:hidden">
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
            'glass-panel w-full shrink-0 rounded-2xl p-4 lg:sticky lg:top-4 lg:block lg:w-56 xl:w-60',
            sidebarOpen ? 'block' : 'hidden lg:block',
          )}
        >
          <h1 className="mb-4 hidden text-lg font-semibold text-white lg:block">{title}</h1>
          <nav className="flex max-h-[70vh] flex-col gap-0.5 overflow-y-auto">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/10',
                  isActive(link.href)
                    ? 'bg-primary/20 text-[#F57C00]'
                    : 'text-muted-foreground',
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
      <div className="glass-panel rounded-2xl p-4">
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
                'rounded-lg px-2.5 py-1.5 text-xs transition-colors hover:bg-white/10',
                isActive(link.href) ? 'bg-primary/20 text-[#F57C00]' : 'text-muted-foreground',
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
