'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { SoundToggle } from '@/components/notifications/SoundToggle';
import { ProfileMiniPreview } from '@/components/profile/ProfileMiniPreview';
import { CartDrawer } from '@/components/store/CartDrawer';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationSocket } from '@/hooks/useNotificationSocket';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Главная' },
  { href: '/store', label: 'Магазин' },
  { href: '/servers', label: 'Серверы' },
  { href: '/rules', label: 'Правила' },
  { href: '/documents', label: 'Документы' },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  useNotificationSocket(isAuthenticated);

  const handleLogout = async () => {
    await logout();
    // Full reload clears React Query + Zustand leftover session state
    window.location.assign('/login');
  };

  return (
    <>
      <header className="pointer-events-auto fixed inset-x-2 top-2 z-30 h-16 rounded-[20px] glass-strong sm:inset-x-3 sm:top-3 lg:left-[calc(var(--sidebar-rail-width)+0.75rem)]">
        <div className="flex h-full items-center gap-3 px-3.5 sm:px-5">
          <Logo size="sm" showText className="no-select ml-12 shrink-0 lg:ml-0" />

          <nav className="mx-auto hidden h-10 items-center gap-0.5 md:flex">
            {navItems.map((item) => {
              const active =
                item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'inline-flex h-9 items-center rounded-xl px-4 text-sm font-medium transition-[background-color,color,box-shadow] duration-200',
                    active
                      ? 'bg-white/[0.1] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07),0_4px_12px_rgba(0,0,0,0.16)]'
                      : 'text-neutral-400 hover:bg-white/[0.05] hover:text-white',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            {isAuthenticated ? (
              <>
                <SoundToggle />
                <NotificationBell />
              </>
            ) : null}

            {isLoading ? (
              <div className="h-10 w-24 animate-pulse rounded-xl bg-white/[0.07]" />
            ) : isAuthenticated && user ? (
              <ProfileMiniPreview
                username={user.username}
                avatar={user.avatar}
                onLogout={handleLogout}
              />
            ) : (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  className="px-3 text-muted-foreground hover:text-white"
                  asChild
                >
                  <Link href="/login">Войти</Link>
                </Button>
                <Button asChild className="hidden sm:inline-flex">
                  <Link href="/register">Регистрация</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      <CartDrawer />
    </>
  );
}
