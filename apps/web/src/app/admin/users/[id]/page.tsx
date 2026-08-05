'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { RoleGroup } from '@twomc/shared';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ArrowLeft, Ban, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useBulkUpdateUsers, useUserFullData } from '@/hooks/admin';

const ROLE_LABELS: Record<string, string> = {
  PLAYER: 'Игрок',
  HELPER: 'Хелпер',
  MODERATOR: 'Модератор',
  ADMIN: 'Админ',
  OWNER: 'Владелец',
};

function EmptyTab({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{text}</p>;
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const { data, isLoading, refetch } = useUserFullData(userId);
  const bulkUpdate = useBulkUpdateUsers();

  const handleBan = () => {
    bulkUpdate.mutate(
      { userIds: [userId], action: 'ban', data: { banReason: 'Бан администратором' } },
      {
        onSuccess: () => {
          toast.success('Пользователь забанен');
          void refetch();
        },
        onError: () => toast.error('Не удалось забанить'),
      },
    );
  };

  const handleUnban = () => {
    bulkUpdate.mutate(
      { userIds: [userId], action: 'unban' },
      {
        onSuccess: () => {
          toast.success('Пользователь разбанен');
          void refetch();
        },
        onError: () => toast.error('Не удалось разбанить'),
      },
    );
  };

  if (isLoading || !data) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  const user = data.user;
  const isBanned = Boolean(user.isBanned);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={user.username}
        description={`#${user.shortId} · ${user.email}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href="/admin/users">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Назад
              </Link>
            </Button>
            {isBanned ? (
              <Button type="button" variant="secondary" size="sm" onClick={handleUnban}>
                <ShieldOff className="mr-1.5 h-4 w-4" />
                Разбанить
              </Button>
            ) : (
              <Button type="button" variant="destructive" size="sm" onClick={handleBan}>
                <Ban className="mr-1.5 h-4 w-4" />
                Забанить
              </Button>
            )}
          </div>
        }
      />

      <div className="glass-panel flex flex-wrap items-center gap-4 rounded-2xl p-5">
        <Avatar className="h-16 w-16">
          <AvatarImage src={(user.avatar as string | null) ?? undefined} alt={user.username} />
          <AvatarFallback>{user.username.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-white">{user.username}</h2>
            <Badge variant="secondary">{ROLE_LABELS[user.roleGroup] ?? user.roleGroup}</Badge>
            {isBanned ? <Badge variant="destructive">Забанен</Badge> : null}
          </div>
          <p className="text-sm text-muted-foreground">
            Регистрация:{' '}
            {format(new Date(user.createdAt), 'd MMMM yyyy', { locale: ru })}
            {user.lastLoginAt
              ? ` · Вход: ${format(new Date(user.lastLoginAt), 'd MMM yyyy, HH:mm', { locale: ru })}`
              : ''}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center sm:grid-cols-6">
          {[
            ['Заказы', data.stats.orders],
            ['Обращения', data.stats.reportsAuthored],
            ['Жалобы', data.stats.reportsAgainst],
            ['Комментарии', data.stats.comments],
            ['Друзья', data.stats.friends],
            ['Наказания', data.stats.punishments],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl glass-medium px-3 py-2">
              <p className="text-lg font-semibold text-white">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="glass-medium flex h-auto flex-wrap gap-1 p-1">
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="orders">Заказы</TabsTrigger>
          <TabsTrigger value="reports">Обращения</TabsTrigger>
          <TabsTrigger value="comments">Комментарии</TabsTrigger>
          <TabsTrigger value="friends">Друзья</TabsTrigger>
          <TabsTrigger value="punishments">Наказания</TabsTrigger>
          <TabsTrigger value="activity">Активность</TabsTrigger>
          <TabsTrigger value="moderation">Модерация</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="glass-panel rounded-2xl p-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Email</dt>
              <dd className="text-white">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Тег</dt>
              <dd className="text-white">{user.tag}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Роль</dt>
              <dd className="text-white">{ROLE_LABELS[user.roleGroup] ?? user.roleGroup}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Причина бана</dt>
              <dd className="text-white">{(user.banReason as string | null) ?? '—'}</dd>
            </div>
          </dl>
        </TabsContent>

        <TabsContent value="orders" className="glass-panel rounded-2xl p-4">
          {data.orders.length === 0 ? (
            <EmptyTab text="Заказов нет" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Номер</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.orders.map((order) => (
                  <TableRow key={String(order.id)}>
                    <TableCell>{String(order.orderNumber ?? order.id).slice(0, 12)}</TableCell>
                    <TableCell>{String(order.status ?? '—')}</TableCell>
                    <TableCell>{String(order.total ?? '—')}</TableCell>
                    <TableCell>
                      {order.createdAt
                        ? format(new Date(String(order.createdAt)), 'd MMM yyyy', { locale: ru })
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="reports" className="glass-panel rounded-2xl p-4">
          {data.reports.authored.length === 0 && data.reports.against.length === 0 ? (
            <EmptyTab text="Обращений нет" />
          ) : (
            <div className="space-y-6">
              <section>
                <h3 className="mb-2 text-sm font-medium text-white">Созданные</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Номер</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.reports.authored.map((r) => (
                      <TableRow key={String(r.id)}>
                        <TableCell>{String(r.reportNumber ?? r.id).slice(0, 12)}</TableCell>
                        <TableCell>{String(r.type ?? '—')}</TableCell>
                        <TableCell>{String(r.status ?? '—')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </section>
              <section>
                <h3 className="mb-2 text-sm font-medium text-white">На пользователя</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Номер</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.reports.against.map((r) => (
                      <TableRow key={String(r.id)}>
                        <TableCell>{String(r.reportNumber ?? r.id).slice(0, 12)}</TableCell>
                        <TableCell>{String(r.type ?? '—')}</TableCell>
                        <TableCell>{String(r.status ?? '—')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </section>
            </div>
          )}
        </TabsContent>

        <TabsContent value="comments" className="glass-panel rounded-2xl p-4">
          {data.comments.length === 0 ? (
            <EmptyTab text="Комментариев нет" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Текст</TableHead>
                  <TableHead>Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.comments.map((c) => (
                  <TableRow key={String(c.id)}>
                    <TableCell className="max-w-md truncate">{String(c.content ?? '—')}</TableCell>
                    <TableCell>
                      {c.createdAt
                        ? format(new Date(String(c.createdAt)), 'd MMM yyyy', { locale: ru })
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="friends" className="glass-panel rounded-2xl p-4">
          {data.friends.length === 0 ? (
            <EmptyTab text="Друзей нет" />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {data.friends.map((friend) => (
                <Link
                  key={friend.id}
                  href={`/admin/users/${friend.id}`}
                  className="flex items-center gap-3 rounded-xl glass-medium p-3 transition-colors hover:bg-white/10"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={friend.avatar ?? undefined} />
                    <AvatarFallback>{friend.username.slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-white">{friend.username}</span>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="punishments" className="glass-panel rounded-2xl p-4">
          {data.punishments.length === 0 ? (
            <EmptyTab text="Наказаний нет" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Тип</TableHead>
                  <TableHead>Причина</TableHead>
                  <TableHead>Активно</TableHead>
                  <TableHead>Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.punishments.map((p) => (
                  <TableRow key={String(p.id)}>
                    <TableCell>{String(p.type ?? '—')}</TableCell>
                    <TableCell>{String(p.reason ?? '—')}</TableCell>
                    <TableCell>{p.isActive ? 'Да' : 'Нет'}</TableCell>
                    <TableCell>
                      {p.issuedAt
                        ? format(new Date(String(p.issuedAt)), 'd MMM yyyy', { locale: ru })
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="activity" className="glass-panel rounded-2xl p-4">
          {data.activity.length === 0 ? (
            <EmptyTab text="Активности нет" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Действие</TableHead>
                  <TableHead>Объект</TableHead>
                  <TableHead>Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.activity.map((a) => (
                  <TableRow key={String(a.id)}>
                    <TableCell>{String(a.action ?? '—')}</TableCell>
                    <TableCell>
                      {a.targetType
                        ? `${String(a.targetType)}${a.targetId ? `:${String(a.targetId).slice(0, 8)}` : ''}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {a.createdAt
                        ? format(new Date(String(a.createdAt)), 'd MMM yyyy, HH:mm', { locale: ru })
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="moderation" className="glass-panel rounded-2xl p-4">
          {user.roleGroup === RoleGroup.PLAYER || user.roleGroup === RoleGroup.HELPER ? (
            <EmptyTab text="Нет данных модерации для этой роли" />
          ) : (
            <EmptyTab text="Детальная статистика модерации — в разделе дашборда" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
