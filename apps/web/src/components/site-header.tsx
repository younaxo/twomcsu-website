'use client';

import { Coins } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { SoundToggle } from '@/components/notifications/SoundToggle';
import { ProfileMiniPreview } from '@/components/profile/ProfileMiniPreview';
import { useMyProfile } from '@/hooks/useFriendsQueries';
import { CartDrawer } from '@/components/store/CartDrawer';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationSocket } from '@/hooks/useNotificationSocket';
import { cn } from '@/lib/utils';

function BalanceChip() {
  const profile = useMyProfile(true);
  const coins = profile.data?.statistics?.coins;

  return (
    <Link
      href="/store"
      className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white/[0.05] px-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
    >
      <Coins className="h-4 w-4 text-primary" aria-hidden />
      {coins != null ? coins.toLocaleString('ru-RU') : '—'}
    </Link>
  );
}

export function SiteHeader() {
  const t = useTranslations('nav');
  const tHeader = useTranslations('header');
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  useNotificationSocket(isAuthenticated);

  const navItems = [
    { href: '/', label: t('home') },
    { href: '/store', label: t('store') },
    { href: '/servers', label: t('servers') },
    { href: '/rules', label: t('rules') },
  ] as const;

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

          <nav
            aria-label={t('headerLabel')}
            className="mx-auto hidden h-10 items-center gap-0.5 md:flex"
          >
            {navItems.map((item) => {
              const active =
                item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
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
            <LanguageSwitcher variant="compact" className="hidden sm:inline-flex" />

            {isAuthenticated ? (
              <>
                <BalanceChip />
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
                  <Link href="/login">{tHeader('login')}</Link>
                </Button>
                <Button asChild className="hidden sm:inline-flex">
                  <Link href="/register">{tHeader('register')}</Link>
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
