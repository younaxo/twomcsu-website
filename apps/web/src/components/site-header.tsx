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
  { href: '/store', label: 'Магазин' },
  { href: '/servers', label: 'Серверы' },
  { href: '/rules', label: 'Правила' },
  { href: '/documents', label: 'Документы' },
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
      <header className="pointer-events-auto fixed inset-x-0 top-0 z-30 h-16 border-b border-white/5 glass-strong">
        <div className="flex h-full items-center gap-4 px-4 sm:px-6 lg:ml-[72px] xl:ml-[260px]">
          <Logo size="sm" withDivider showText className="no-select shrink-0" />

          <nav className="hidden flex-1 items-center justify-center gap-6 md:flex">
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
                    'relative inline-flex items-center gap-1.5 pb-0.5 text-[15px] font-medium transition-colors duration-200',
                    active
                      ? 'font-semibold text-primary after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:bg-primary'
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

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
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
        </div>
      </header>
      <CartDrawer />
    </>
  );
}
