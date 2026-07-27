'use client';

import { RoleGroup, hasRoleGroup } from '@twomc/shared';
import { ChevronDown, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { CartDrawer } from '@/components/store/CartDrawer';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { DefaultAvatar } from '@/components/shared/DefaultAvatar';
import { PositionBadge } from '@/components/shared/PositionBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useFriendRequestsCount } from '@/hooks/useFriendRequestsCount';
import { useUnreadNotificationsCount } from '@/hooks/useNotifications';
import { useCart } from '@/hooks/store';
import { useStoreUiStore } from '@/stores/storeUiStore';

const navItems = [
  { href: '/', label: 'Главная' },
  { href: '/servers', label: 'Серверы' },
  { href: '/store', label: 'Магазин' },
  { href: '/', label: 'Правила' },
];

export function SiteHeader() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const incomingCount = useFriendRequestsCount();
  const unreadNotifications = useUnreadNotificationsCount(isAuthenticated);
  const cart = useCart(isAuthenticated);
  const openCartDrawer = useStoreUiStore((s) => s.openCartDrawer);
  const cartCount = cart.data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const notifCount = unreadNotifications.data?.count ?? 0;

  const handleLogout = async () => {
    await logout();
    toast.success('Вы вышли из аккаунта');
    router.push('/');
    router.refresh();
  };

  const skinUrl = user?.username
    ? `https://minotar.net/helm/${user.username}/64.png`
    : (user?.avatar ?? undefined);

  return (
    <>
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
          <Link href="/" className="logo text-xl text-white">
            twomc<span className="text-primary">.su</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative"
                      onClick={() => openCartDrawer()}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {cartCount > 0 ? (
                        <Badge
                          variant="destructive"
                          className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1 text-[10px]"
                        >
                          {cartCount > 99 ? '99+' : cartCount}
                        </Badge>
                      ) : null}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Корзина</TooltipContent>
                </Tooltip>
              </>
            ) : null}

            {isLoading ? (
              <div className="h-9 w-24 animate-pulse rounded-md bg-secondary" />
            ) : isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative gap-2 px-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={skinUrl} alt={user.username} />
                      <AvatarFallback className="p-0">
                        <DefaultAvatar username={user.username} letterClassName="text-xs" />
                      </AvatarFallback>
                    </Avatar>
                    <ColoredUsername
                      user={user}
                      size="sm"
                      linkToProfile={false}
                      className="max-w-32"
                    />
                    <PositionBadge
                      position={user.position}
                      size="sm"
                      className="hidden md:inline-flex"
                    />
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    {incomingCount > 0 ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="absolute -right-1 -top-1">
                            <Badge
                              variant="destructive"
                              className="h-5 min-w-5 justify-center px-1 text-[10px]"
                            >
                              {incomingCount}
                            </Badge>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>Входящие запросы в друзья</TooltipContent>
                      </Tooltip>
                    ) : null}
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
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
                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile/friends"
                      className="flex w-full items-center justify-between"
                    >
                      <span>Друзья</span>
                      {incomingCount > 0 ? (
                        <Badge
                          variant="destructive"
                          className="h-5 min-w-5 justify-center px-1.5"
                          onClick={(e) => e.preventDefault()}
                        >
                          {incomingCount}
                        </Badge>
                      ) : null}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile/wishlist">Желаемое</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile/orders">Заказы</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile/notifications"
                      className="flex w-full items-center justify-between"
                    >
                      <span>Уведомления</span>
                      {notifCount > 0 ? (
                        <Badge
                          variant="destructive"
                          className="h-5 min-w-5 justify-center px-1.5"
                          onClick={(e) => e.preventDefault()}
                        >
                          {notifCount > 99 ? '99+' : notifCount}
                        </Badge>
                      ) : null}
                    </Link>
                  </DropdownMenuItem>
                  {hasRoleGroup(user.roleGroup, RoleGroup.ADMIN) ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin/store/products">Админ: магазин</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/store/stats">Админ: статистика</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/orders">Админ: заказы</Link>
                      </DropdownMenuItem>
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
                        <Link href="/admin/profile-reports">Жалобы на профили</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/comment-reports">Жалобы на комментарии</Link>
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
        </div>
      </header>
      <CartDrawer />
    </>
  );
}
