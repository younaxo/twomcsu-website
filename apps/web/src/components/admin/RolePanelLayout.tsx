'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export type PanelNavLink = {
  href: string;
  label: string;
};

type RolePanelLayoutProps = {
  title: string;
  links: PanelNavLink[];
  children: React.ReactNode;
};

export function RolePanelLayout({ title, links, children }: RolePanelLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-4">
        <h1 className="mb-3 text-lg font-semibold text-white">{title}</h1>
        <nav className="flex flex-wrap gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-lg px-2.5 py-1.5 text-xs transition-colors hover:bg-white/10',
                pathname === link.href || pathname.startsWith(`${link.href}/`)
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground',
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
