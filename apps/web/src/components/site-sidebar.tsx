'use client';

import { RoleGroup, hasRoleGroup } from '@twomc/shared';
import type { ComponentType } from 'react';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Coins,
  FileText,
  Home,
  LayoutDashboard,
  Mail,
  Medal,
  Menu,
  MessageCircle,
  MessagesSquare,
  Newspaper,
  Play,
  Radio,
  Scale,
  Send,
  Server,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Trophy,
  Vote,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useEffect, useState } from 'react';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { Logo } from '@/components/shared/Logo';
import { CurrencySelector } from '@/components/store/CurrencySelector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/store';
import { useConversations } from '@/hooks/useDirectMessages';
import { useMyProfile } from '@/hooks/useFriendsQueries';
import { useChatStore } from '@/stores/chatStore';
import { useStoreUiStore } from '@/stores/storeUiStore';
import { cn } from '@/lib/utils';

type NavItem = {
  href?: string;
  labelKey: string;
  icon: ComponentType<{ className?: string }>;
  soon?: boolean;
  action?: 'chat' | 'cart';
};

type NavGroup = {
  titleKey: string;
  items: NavItem[];
};

const mainGroups: NavGroup[] = [
  {
    titleKey: 'groupMain',
    items: [
      { href: '/', labelKey: 'home', icon: Home },
      { href: '/store', labelKey: 'store', icon: ShoppingBag },
      { href: '/servers', labelKey: 'servers', icon: Server },
      { href: '/news', labelKey: 'news', icon: Newspaper },
      { href: '/events', labelKey: 'events', icon: CalendarDays },
      { href: '/feed', labelKey: 'feed', icon: Activity },
      { href: '/achievements', labelKey: 'achievements', icon: Trophy },
      { href: '/leaderboards', labelKey: 'leaderboards', icon: Medal },
      { href: '/streams', labelKey: 'streams', icon: Radio },
      { href: '/vote', labelKey: 'vote', icon: Vote },
    ],
  },
  {
    titleKey: 'groupCommunity',
    items: [
      { href: '/rules', labelKey: 'rules', icon: Scale },
      { href: '/documents', labelKey: 'documents', icon: FileText },
      { href: '/forms', labelKey: 'forms', icon: ClipboardList },
      { href: '/wiki', labelKey: 'wiki', icon: BookOpen, soon: true },
      { href: '/reports', labelKey: 'reports', icon: AlertTriangle, soon: true },
    ],
  },
];

const quickAccess: NavItem[] = [
  { href: '/messages', labelKey: 'messages', icon: MessagesSquare },
  { labelKey: 'chat', icon: MessageCircle, action: 'chat' },
  { labelKey: 'cart', icon: ShoppingCart, action: 'cart' },
];

function NavButton({
  item,
  label,
  active,
  badge,
  soonLabel,
  onAction,
  collapsed,
}: {
  item: NavItem;
  label: string;
  active?: boolean;
  badge?: number;
  soonLabel: string;
  onAction?: () => void;
  collapsed?: boolean;
}) {
  const Icon = item.icon;
  const content = (
    <span
      className={cn(
        'relative flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-[background-color,color] duration-200',
        collapsed && 'justify-center px-2',
        active
          ? 'bg-white/[0.09] text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
          : 'text-muted-foreground hover:bg-white/[0.05] hover:text-foreground',
        item.soon && 'opacity-70',
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0', active && 'text-primary')} />
      {!collapsed ? (
        <span className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium">
          <span className="truncate">{label}</span>
          {item.soon ? (
            <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[10px]">
              {soonLabel}
            </Badge>
          ) : null}
        </span>
      ) : null}
      {badge && badge > 0 ? (
        <Badge
          variant="destructive"
          className={cn(
            'h-5 min-w-5 justify-center px-1 text-[10px]',
            collapsed ? 'absolute -right-0.5 -top-0.5' : 'ml-auto',
          )}
        >
          {badge > 99 ? '99+' : badge}
        </Badge>
      ) : null}
    </span>
  );

  const node = item.href ? (
    <Link href={item.href} className="block cursor-pointer" aria-label={label}>
      {content}
    </Link>
  ) : (
    <button
      type="button"
      className="block w-full cursor-pointer"
      onClick={onAction}
      aria-label={label}
    >
      {content}
    </button>
  );

  if (!collapsed) return node;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="block cursor-pointer">{node}</span>
      </TooltipTrigger>
      <TooltipContent side="right" className="flex items-center gap-2">
        {label}
        {item.soon ? <span className="text-muted-foreground">· {soonLabel}</span> : null}
      </TooltipContent>
    </Tooltip>
  );
}

function GroupTitle({ title, collapsed }: { title: string; collapsed?: boolean }) {
  if (collapsed) {
    return <div className="mx-auto my-2 h-px w-8 bg-white/10" aria-hidden />;
  }
  return (
    <p className="px-3 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      {title}
    </p>
  );
}

function SidebarTopActions({ collapsed }: { collapsed?: boolean }) {
  const t = useTranslations('footer');
  const { isAuthenticated } = useAuth();
  const profile = useMyProfile(isAuthenticated);
  const coins = profile.data?.statistics?.coins;

  const balance = isAuthenticated ? (
    <Link
      href="/store"
      className={cn(
        'flex h-10 items-center gap-1.5 rounded-xl bg-white/[0.05] text-sm font-semibold text-foreground transition-colors hover:bg-white/[0.08]',
        collapsed ? 'w-full justify-center' : 'w-full px-3',
      )}
    >
      <Coins className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      {coins != null ? coins.toLocaleString('ru-RU') : '—'}
    </Link>
  ) : null;

  const play = (
    <Link
      href="/servers"
      className={cn(
        'flex h-11 items-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_6px_18px_rgba(0,0,0,0.2)] transition-colors hover:bg-primary-hover',
        collapsed ? 'w-full justify-center' : 'w-full px-3',
      )}
      aria-label={t('startPlaying')}
    >
      <Play className="h-4 w-4 shrink-0 fill-current" aria-hidden />
      {!collapsed ? t('startPlaying') : null}
    </Link>
  );

  if (!collapsed) {
    return (
      <div className="shrink-0 space-y-2 px-2.5 pt-3">
        {balance}
        {play}
      </div>
    );
  }

  return (
    <div className="shrink-0 space-y-2 px-2 pt-3">
      {balance ? (
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>{balance}</TooltipTrigger>
          <TooltipContent side="right">
            {coins != null ? coins.toLocaleString('ru-RU') : '—'}
          </TooltipContent>
        </Tooltip>
      ) : null}
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>{play}</TooltipTrigger>
        <TooltipContent side="right">{t('startPlaying')}</TooltipContent>
      </Tooltip>
    </div>
  );
}

function SidebarNav({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const openCartDrawer = useStoreUiStore((s) => s.openCartDrawer);
  const setWidgetOpen = useChatStore((s) => s.setWidgetOpen);
  const unreadChat = useChatStore((s) => Object.values(s.unreadCounts).reduce((a, b) => a + b, 0));
  const cart = useCart(isAuthenticated);
  const conversations = useConversations(isAuthenticated);
  const cartCount = cart.data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const unreadMessages = conversations.data?.totalUnread ?? 0;

  const roleItems: NavItem[] = [];
  if (user && hasRoleGroup(user.roleGroup, RoleGroup.HELPER)) {
    roleItems.push({ href: '/moderation', labelKey: 'moderation', icon: Shield });
  }
  if (user && hasRoleGroup(user.roleGroup, RoleGroup.ADMIN)) {
    roleItems.push({ href: '/admin', labelKey: 'admin', icon: LayoutDashboard });
  }
  if (user && hasRoleGroup(user.roleGroup, RoleGroup.OWNER)) {
    roleItems.push({ href: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard });
  }

  const handleAction = (action?: 'chat' | 'cart') => {
    if (action === 'chat') setWidgetOpen(true);
    if (action === 'cart') openCartDrawer();
    onNavigate?.();
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SidebarTopActions collapsed={collapsed} />
      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2.5 py-2">
        {mainGroups.map((group) => {
          const items =
            group.titleKey === 'groupCommunity' && isAuthenticated
              ? [
                  ...group.items,
                  { href: '/report', labelKey: 'reportsAuth', icon: Mail } satisfies NavItem,
                ]
              : group.items;

          return (
            <div key={group.titleKey} className="mb-1">
              <GroupTitle title={t(group.titleKey)} collapsed={collapsed} />
              <div className="flex flex-col gap-0.5">
                {items.map((item) => (
                  <div key={item.labelKey} onClick={onNavigate}>
                    <NavButton
                      item={item}
                      label={t(item.labelKey)}
                      soonLabel={t('soon')}
                      active={isActive(item.href)}
                      collapsed={collapsed}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {roleItems.length > 0 ? (
          <div className="mb-1">
            <GroupTitle title={t('groupPanels')} collapsed={collapsed} />
            <div className="flex flex-col gap-0.5">
              {roleItems.map((item) => (
                <div key={item.labelKey} onClick={onNavigate}>
                  <NavButton
                    item={item}
                    label={t(item.labelKey)}
                    soonLabel={t('soon')}
                    active={isActive(item.href)}
                    collapsed={collapsed}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </nav>

      <div className="mt-auto shrink-0 space-y-1 border-t border-white/[0.07] px-2.5 py-3">
        {!collapsed ? (
          <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t('quickAccess')}
          </p>
        ) : (
          <div className="mx-auto my-1 h-px w-8 bg-white/10" aria-hidden />
        )}
        {quickAccess.map((item) => (
          <NavButton
            key={item.labelKey}
            item={item}
            label={t(item.labelKey)}
            soonLabel={t('soon')}
            collapsed={collapsed}
            active={isActive(item.href)}
            badge={
              item.href === '/messages'
                ? unreadMessages
                : item.action === 'chat'
                  ? unreadChat
                  : item.action === 'cart'
                    ? cartCount
                    : undefined
            }
            onAction={() => handleAction(item.action)}
          />
        ))}
        <div className={cn('pt-1', collapsed && 'flex justify-center')}>
          {collapsed ? (
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <CurrencySelector compact className="h-10 w-full justify-center px-2" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">{t('quickAccess')}</TooltipContent>
            </Tooltip>
          ) : (
            <CurrencySelector compact className="w-full" />
          )}
        </div>

        <div
          className={cn('mx-auto my-1 h-px w-8 bg-white/10', !collapsed && 'mx-3 w-auto')}
          aria-hidden
        />

        {collapsed ? (
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <a
                href="https://t.me/twomcsu_adm"
                target="_blank"
                rel="noreferrer"
                className="flex h-10 w-full items-center justify-center rounded-xl text-[#2AABEE] transition-colors hover:bg-[#2AABEE]/10"
                aria-label="Telegram"
              >
                <Send className="h-4 w-4" aria-hidden />
              </a>
            </TooltipTrigger>
            <TooltipContent side="right">Telegram · @twomcsu_adm</TooltipContent>
          </Tooltip>
        ) : (
          <a
            href="https://t.me/twomcsu_adm"
            target="_blank"
            rel="noreferrer"
            className="flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-[#2AABEE] transition-colors hover:bg-[#2AABEE]/10"
          >
            <Send className="h-4 w-4 shrink-0" aria-hidden />
            @twomcsu_adm
          </a>
        )}

        <div className={cn('pt-1', collapsed && 'flex justify-center')}>
          <LanguageSwitcher
            variant={collapsed ? 'compact' : 'full'}
            className={collapsed ? undefined : 'w-full'}
          />
        </div>
      </div>
    </div>
  );
}

export function SiteSidebar() {
  const t = useTranslations('nav');
  const th = useTranslations('header');
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-rail-width', '72px');
  }, []);

  return (
    <>
      {/* Desktop sidebar — fixed-width icon rail, not user-resizable */}
      <aside
        className="glass-strong pointer-events-auto fixed bottom-3 left-3 top-3 z-40 hidden w-[72px] flex-col overflow-hidden rounded-[20px] lg:flex"
        aria-label={t('sidebarLabel')}
      >
        <div className="flex h-[68px] shrink-0 items-center justify-center border-b border-white/[0.07] px-3">
          <Logo size="sm" showText={false} />
        </div>
        <div className="min-h-0 flex-1">
          <SidebarNav collapsed />
        </div>
      </aside>

      {/* Mobile hamburger */}
      <div className="fixed left-3 top-3 z-40 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-xl bg-white/[0.05] text-foreground"
              aria-label={th('openMenu')}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="glass-strong w-[min(100vw-2rem,280px)] p-0">
            <SheetHeader className="border-b border-white/[0.07] px-4 py-4 text-left">
              <SheetTitle className="text-base">{th('menu')}</SheetTitle>
            </SheetHeader>
            <div className="h-[calc(100%-4rem)] overflow-y-auto">
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
