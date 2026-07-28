'use client';

import { Construction, Search, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ProfileMiniPreview } from '@/components/profile/ProfileMiniPreview';
import { CartDrawer } from '@/components/store/CartDrawer';
import { CurrencySelector } from '@/components/store/CurrencySelector';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await logout();
    toast.success('Вы вышли из аккаунта');
    router.push('/');
    router.refresh();
  };

  const submitSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearchOpen(false);
    router.push(`/users/${encodeURIComponent(q)}`);
  };

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 h-24" aria-hidden />
      <header
        className={cn(
          'glass-panel pointer-events-auto fixed left-1/2 top-5 z-50 flex w-[92%] max-w-[1440px] -translate-x-1/2 items-center justify-between gap-4',
          'rounded-[20px] px-5 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] sm:px-7',
        )}
      >
        <Logo size="sm" withDivider showText className="shrink-0" />

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
          <CurrencySelector className="hidden h-9 w-[7.5rem] border-white/10 bg-black/30 sm:flex" />

          {searchOpen ? (
            <div className="flex items-center gap-1">
              <Input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ник игрока…"
                className="h-9 w-32 border-white/10 bg-black/30 sm:w-44"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitSearch();
                  if (e.key === 'Escape') setSearchOpen(false);
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9"
                onClick={() => setSearchOpen(false)}
                aria-label="Закрыть поиск"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 cursor-help text-[#b0b0b0] hover:text-white"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Поиск"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Поиск</TooltipContent>
            </Tooltip>
          )}

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
