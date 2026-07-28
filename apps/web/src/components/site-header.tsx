'use client';

import { RoleGroup, hasRoleGroup } from '@twomc/shared';
import {
  ChevronDown,
  Menu,
  MessageCircle,
  Search,
  ShoppingCart,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { CartDrawer } from '@/components/store/CartDrawer';
import { Logo } from '@/components/shared/Logo';
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
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useFriendRequestsCount } from '@/hooks/useFriendRequestsCount';
import { useUnreadNotificationsCount } from '@/hooks/useNotifications';
import { useChatStore } from '@/stores/chatStore';
import { useCart } from '@/hooks/store';
import { useStoreUiStore } from '@/stores/storeUiStore';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Главная' },
  { href: '/store', label: 'Магазин' },
  { href: '/servers', label: 'Серверы' },
  { href: '/', label: 'Новости' },
  { href: '/', label: 'Помощь' },
];

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const incomingCount = useFriendRequestsCount();
  const unreadNotifications = useUnreadNotificationsCount(isAuthenticated);
  const cart = useCart(isAuthenticated);
  const openCartDrawer = useStoreUiStore((s) => s.openCartDrawer);
  const setWidgetOpen = useChatStore((s) => s.setWidgetOpen);
  const unreadChat = useChatStore((s) =>
    Object.values(s.unreadCounts).reduce((a, b) => a + b, 0),
  );
  const cartCount = cart.data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const notifCount = unreadNotifications.data?.count ?? 0;
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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

  const skinUrl = user?.username
    ? `https://minotar.net/helm/${user.username}/64.png`
    : (user?.avatar ?? undefined);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Logo size="sm" />

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-sm transition-colors',
                    active
                      ? 'bg-primary/15 text-white'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-white',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            {searchOpen ? (
              <div className="flex items-center gap-1">
                <Input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ник игрока…"
                  className="h-9 w-36 sm:w-48"
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
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9"
                    onClick={() => setSearchOpen(true)}
                    aria-label="Поиск"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Поиск</TooltipContent>
              </Tooltip>
            )}

            {isAuthenticated ? (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="relative h-9 w-9"
                      onClick={() => setWidgetOpen(true)}
                      aria-label="Чат"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {unreadChat > 0 ? (
                        <Badge
                          variant="destructive"
                          className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1 text-[10px]"
                        >
                          {unreadChat > 99 ? '99+' : unreadChat}
                        </Badge>
                      ) : null}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Чат</TooltipContent>
                </Tooltip>
                <NotificationBell />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative h-9 w-9"
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
                      className="hidden max-w-32 sm:inline"
                    />
                    <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
                    {incomingCount > 0 ? (
                      <span className="absolute -right-1 -top-1">
                        <Badge
                          variant="destructive"
                          className="h-5 min-w-5 justify-center px-1 text-[10px]"
                        >
                          {incomingCount}
                        </Badge>
                      </span>
                    ) : null}
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <PositionBadge position={user.position} size="sm" />
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/users/${user.username}`}>Профиль</Link>
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
                        <Badge variant="destructive" className="h-5 min-w-5 justify-center px-1.5">
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
                        <Badge variant="destructive" className="h-5 min-w-5 justify-center px-1.5">
                          {notifCount > 99 ? '99+' : notifCount}
                        </Badge>
                      ) : null}
                    </Link>
                  </DropdownMenuItem>
                  {hasRoleGroup(user.roleGroup, RoleGroup.ADMIN) ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin">Админ-панель</Link>
                      </DropdownMenuItem>
                    </>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleLogout}>Выйти</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Button variant="ghost" asChild>
                  <Link href="/login">Войти</Link>
                </Button>
                <Button asChild className="bg-gradient-primary shadow-glow-primary">
                  <Link href="/register">Регистрация</Link>
                </Button>
              </div>
            )}

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 lg:hidden"
                  aria-label="Меню"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(100vw-2rem,320px)] border-white/10 bg-card/95 backdrop-blur-xl">
                <SheetHeader>
                  <SheetTitle>
                    <Logo size="sm" />
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                {!isAuthenticated && !isLoading ? (
                  <div className="mt-6 flex flex-col gap-2">
                    <Button variant="secondary" asChild>
                      <Link href="/login">Войти</Link>
                    </Button>
                    <Button asChild className="bg-gradient-primary">
                      <Link href="/register">Регистрация</Link>
                    </Button>
                  </div>
                ) : null}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <CartDrawer />
    </>
  );
}
