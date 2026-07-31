'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  AlertTriangle,
  Ban,
  Command,
  DollarSign,
  Megaphone,
  Server,
  Settings,
  Shield,
  Users,
  Wifi,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AreaChartCard,
  BarChartCard,
  BookmarksGrid,
  DashboardCard,
  LineChartCard,
  PieChartCard,
  QuickActionsMenu,
  TopList,
} from '@/components/admin';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useBookmarks,
  useCreateBookmark,
  useDeleteBookmark,
  useDashboardOverview,
  useModeratorActivity,
  useReorderBookmarks,
  useReportsChartData,
  useRevenueChartData,
  useServersChartData,
  useTopBuyers,
  useTopProducts,
  useUsersChartData,
} from '@/hooks/admin';
import { useAuth } from '@/hooks/useAuth';

function formatCurrency(value: number): string {
  return `${value.toLocaleString('ru-RU')} ₽`;
}

export default function OwnerDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [quickOpen, setQuickOpen] = useState(false);
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const [bookmarkForm, setBookmarkForm] = useState({ title: '', url: '' });

  const overview = useDashboardOverview();
  const usersChart = useUsersChartData(30);
  const revenueChart = useRevenueChartData(30);
  const reportsChart = useReportsChartData(30);
  const serversChart = useServersChartData(24);
  const topProducts = useTopProducts(10);
  const topBuyers = useTopBuyers(10);
  const moderatorActivity = useModeratorActivity(30);
  const bookmarks = useBookmarks();
  const createBookmark = useCreateBookmark();
  const deleteBookmark = useDeleteBookmark();
  const reorderBookmarks = useReorderBookmarks();

  const today = format(new Date(), 'd MMMM yyyy, EEEE', { locale: ru });

  const quickActions = useMemo(
    () => [
      {
        id: 'users',
        label: 'Пользователи',
        group: 'Навигация',
        keywords: ['users'],
        onSelect: () => router.push('/admin/users'),
      },
      {
        id: 'audit',
        label: 'Audit log',
        group: 'Навигация',
        onSelect: () => router.push('/admin/audit-log'),
      },
      {
        id: 'settings',
        label: 'Настройки сайта',
        group: 'Навигация',
        onSelect: () => router.push('/admin/settings/site'),
      },
      {
        id: 'broadcast',
        label: 'Рассылка',
        group: 'Действия',
        onSelect: () => router.push('/admin/broadcast'),
      },
      {
        id: 'exports',
        label: 'Запланированный экспорт',
        group: 'Действия',
        onSelect: () => router.push('/admin/exports/scheduled'),
      },
      {
        id: 'admin',
        label: 'Админ-панель',
        group: 'Навигация',
        onSelect: () => router.push('/admin/users'),
      },
    ],
    [router],
  );

  const serversAreaData = useMemo(() => {
    return (serversChart.data ?? []).map((row) => {
      const { hour, ...servers } = row;
      const total = Object.values(servers).reduce<number>(
        (sum, value) => (typeof value === 'number' ? sum + value : sum),
        0,
      );
      return {
        hour: String(hour).slice(11, 16),
        total,
      };
    });
  }, [serversChart.data]);

  const moderatorBarData = useMemo(
    () =>
      (moderatorActivity.data ?? []).map((item) => ({
        name: item.username,
        resolved: item.resolvedCount,
      })),
    [moderatorActivity.data],
  );

  const handleReorder = (id: string, direction: 'up' | 'down') => {
    const sorted = [...(bookmarks.data ?? [])].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((b) => b.id === id);
    if (index < 0) return;
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;
    const next = [...sorted];
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    reorderBookmarks.mutate(next.map((b) => b.id));
  };

  const handleAddBookmark = async () => {
    const title = bookmarkForm.title.trim();
    const url = bookmarkForm.url.trim();
    if (!title || !url) return;
    try {
      await createBookmark.mutateAsync({ title, url });
      setBookmarkForm({ title: '', url: '' });
      setBookmarkOpen(false);
      toast.success('Закладка добавлена');
    } catch {
      toast.error('Не удалось добавить закладку');
    }
  };

  const o = overview.data;

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              Добро пожаловать, {user?.username ?? 'администратор'}!
            </h1>
            <p className="mt-1 text-sm capitalize text-muted-foreground">{today}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setQuickOpen(true)}>
              <Command className="mr-1.5 h-4 w-4" />
              Ctrl+K
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/admin/broadcast">
                <Megaphone className="mr-1.5 h-4 w-4" />
                Рассылка
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/admin/settings/site">
                <Settings className="mr-1.5 h-4 w-4" />
                Настройки
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/admin/audit-log">
                <Shield className="mr-1.5 h-4 w-4" />
                Audit log
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {overview.isLoading || !o ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <DashboardCard
            title="Пользователи"
            value={o.users.total.toLocaleString('ru-RU')}
            icon={Users}
            changePercent={o.users.change24hPct}
          />
          <DashboardCard
            title="Онлайн сейчас"
            value={o.users.onlineNow.toLocaleString('ru-RU')}
            icon={Wifi}
          />
          <DashboardCard
            title="В игре"
            value={o.users.onlineInGame.toLocaleString('ru-RU')}
            icon={Server}
          />
          <DashboardCard
            title="Выручка сегодня"
            value={formatCurrency(o.orders.revenueToday)}
            icon={DollarSign}
            changePercent={o.orders.revenueChangePct}
          />
          <DashboardCard
            title="Открытые обращения"
            value={o.reports.pending + o.reports.inReview}
            icon={AlertTriangle}
            changePercent={o.reports.pendingChangePct}
          />
          <DashboardCard
            title="Активные баны"
            value={o.users.activeBans.toLocaleString('ru-RU')}
            icon={Ban}
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <LineChartCard
          title="Регистрации"
          description="За последние 30 дней"
          data={usersChart.data ?? []}
          dataKey="count"
        />
        <BarChartCard
          title="Выручка"
          description="За последние 30 дней"
          data={revenueChart.data ?? []}
          dataKey="total"
          formatTooltip={formatCurrency}
        />
        <PieChartCard
          title="Обращения по типам"
          description="За последние 30 дней"
          data={(reportsChart.data ?? []).map((row) => ({
            name: row.type,
            value: row.count,
          }))}
        />
        <AreaChartCard
          title="Онлайн на серверах"
          description="За последние 24 часа"
          data={serversAreaData}
          dataKey="total"
          xKey="hour"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TopList
          title="Топ товаров"
          valueLabel="Продажи"
          items={(topProducts.data ?? []).map((p) => ({
            id: p.productId ?? p.name,
            rank: p.rank,
            title: p.name,
            subtitle: formatCurrency(p.revenue),
            value: p.sold,
            imageUrl: p.image,
            href: p.slug ? `/store/${p.slug}` : undefined,
          }))}
        />
        <TopList
          title="Топ покупателей"
          valueLabel="Потрачено"
          items={(topBuyers.data ?? []).map((b) => ({
            id: b.user?.id ?? String(b.rank),
            rank: b.rank,
            title: b.user?.username ?? 'Неизвестно',
            subtitle: `${b.ordersCount} заказов`,
            value: formatCurrency(b.totalSpent),
            imageUrl: b.user?.avatar,
            href: b.user ? `/admin/users/${b.user.id}` : undefined,
          }))}
        />
      </div>

      <BarChartCard
        title="Активность модераторов"
        description="Решённые обращения за 30 дней"
        data={moderatorBarData}
        dataKey="resolved"
        xKey="name"
        height={280}
      />

      <BookmarksGrid
        bookmarks={bookmarks.data ?? []}
        onAdd={() => setBookmarkOpen(true)}
        onDelete={(id) => {
          deleteBookmark.mutate(id, {
            onSuccess: () => toast.success('Закладка удалена'),
            onError: () => toast.error('Не удалось удалить'),
          });
        }}
        onReorder={handleReorder}
      />

      <QuickActionsMenu actions={quickActions} open={quickOpen} onOpenChange={setQuickOpen} />

      <Dialog open={bookmarkOpen} onOpenChange={setBookmarkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новая закладка</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="bm-title">Название</Label>
              <Input
                id="bm-title"
                value={bookmarkForm.title}
                onChange={(e) => setBookmarkForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bm-url">URL</Label>
              <Input
                id="bm-url"
                value={bookmarkForm.url}
                placeholder="/admin/users или https://…"
                onChange={(e) => setBookmarkForm((f) => ({ ...f, url: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setBookmarkOpen(false)}>
              Отмена
            </Button>
            <Button
              type="button"
              onClick={handleAddBookmark}
              disabled={createBookmark.isPending}
            >
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
