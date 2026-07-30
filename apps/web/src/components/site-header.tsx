'use client';

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
  { href: '/store', label: 'Магазин' },
  { href: '/rules', label: 'Правила' },
  { href: '/report', label: 'Обращения' },
  { href: '/wiki', label: 'Вики', disabled: true },
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
      <header
        className={cn(
          'sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between gap-4',
          'border-b border-white/5 px-4 sm:px-6',
          'glass-strong',
        )}
      >
        <Logo size="sm" withDivider showText className="no-select shrink-0" />

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 md:flex">
          {navItems.map((item) => {
            const disabled = 'disabled' in item && item.disabled;
            const active =
              !disabled &&
              (item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(`${item.href}/`));

            if (disabled) {
              return (
                <span
                  key={item.label}
                  className="cursor-not-allowed text-[15px] font-medium text-[#b0b0b0] opacity-40"
                >
                  {item.label}
                </span>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'relative inline-flex items-center border-b-2 border-transparent pb-0.5 text-[15px] font-medium transition-all duration-200',
                  active
                    ? 'border-[#F57C00] font-semibold text-[#F57C00]'
                    : 'text-[#b0b0b0] hover:text-white',
                )}
              >
                {item.label}
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
              <Button
                variant="ghost"
                className="glass-hover-orange text-[#b0b0b0] hover:text-white"
                asChild
              >
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
