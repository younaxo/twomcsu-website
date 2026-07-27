'use client';

import { RoleGroup, hasRoleGroup } from '@twomc/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { PositionBadge } from '@/components/shared/PositionBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';

// TODO: заменить заглушку на реальную навигацию
const navItems = [
  { href: '/', label: 'Главная' },
  { href: '/', label: 'Магазин' },
  { href: '/', label: 'Правила' },
];

export function SiteHeader() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.success('Вы вышли из аккаунта');
    router.push('/');
    router.refresh();
  };

  const skinUrl = user?.minecraftNick
    ? `https://minotar.net/helm/${user.minecraftNick}/64.png`
    : (user?.avatar ?? undefined);

  return (
    <header className="border-b border-border bg-card/60 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
        <Link href="/" className="logo text-xl text-white">
          twomc<span className="text-primary">.su</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="transition-colors hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>

        {isLoading ? (
          <div className="h-9 w-24 animate-pulse rounded-md bg-secondary" />
        ) : isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={skinUrl} alt={user.username} />
                  <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <ColoredUsername user={user} size="sm" linkToProfile={false} className="max-w-32" />
                <PositionBadge
                  position={user.position}
                  size="sm"
                  className="hidden md:inline-flex"
                />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>
                <PositionBadge position={user.position} size="sm" />
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/users/${user.username}`}>Мой профиль</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile/settings">Настройки</Link>
              </DropdownMenuItem>
              {hasRoleGroup(user.roleGroup, RoleGroup.ADMIN) ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin/positions">Позиции</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/badges">Бейджи</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/awards">Награды</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/media-requests">Медиа-заявки</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/profile-reports">Жалобы</Link>
                  </DropdownMenuItem>
                </>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout}>Выйти</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Войти</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Регистрация</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
