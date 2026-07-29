'use client';

import { Construction } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ProfileMiniPreview } from '@/components/profile/ProfileMiniPreview';
import { CartDrawer } from '@/components/store/CartDrawer';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Главная' },
  { href: '/wiki', label: 'Вики', soon: true },
] as const;

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.success('Вы вышли из аккаунта');
    router.push('/');
    router.refresh();
  };

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 h-24 lg:left-28" aria-hidden />
      <header
        className={cn(
          'pointer-events-auto fixed left-1/2 top-5 z-50 flex w-[92%] max-w-[1440px] -translate-x-1/2 items-center justify-between gap-4',
          'glass-heavy rounded-[20px] px-5 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] sm:px-7',
          'lg:left-[calc(3.5rem+50%)] lg:w-[min(92%,calc(100%-7rem))]',
        )}
      >
        <Logo size="sm" withDivider showText className="no-select shrink-0" />

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 md:flex">
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
                  'relative inline-flex items-center gap-1.5 text-[15px] font-medium transition-colors duration-250',
                  active
                    ? 'font-semibold text-primary after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:bg-primary'
                    : 'text-[#b0b0b0] hover:text-white',
                )}
              >
                {item.label}
                {'soon' in item && item.soon ? (
                  <Construction className="h-3.5 w-3.5 text-muted-foreground" aria-label="В разработке" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          {isAuthenticated ? <NotificationBell /> : null}

          {isLoading ? (
            <div className="h-9 w-20 animate-pulse rounded-md bg-white/10" />
          ) : isAuthenticated && user ? (
            <ProfileMiniPreview
              username={user.username}
              avatar={user.avatar}
              onLogout={handleLogout}
            />
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" className="text-[#b0b0b0] hover:text-white" asChild>
                <Link href="/login">Войти</Link>
              </Button>
              <Button asChild className="bg-gradient-primary shadow-glow-primary">
                <Link href="/register">Регистрация</Link>
              </Button>
            </div>
          )}
        </div>
      </header>
      <CartDrawer />
    </>
  );
}
