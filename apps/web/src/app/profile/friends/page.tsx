'use client';

import { Search, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { BlockedUserCard } from '@/components/shared/BlockedUserCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { FriendCard } from '@/components/shared/FriendCard';
import { FriendRequestCard } from '@/components/shared/FriendRequestCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useBlockedUsers,
  useFriends,
  useIncomingRequests,
  useIncomingRequestsCount,
  useOutgoingRequests,
} from '@/hooks/useFriendsQueries';

const PAGE_SIZE = 12;

export default function FriendsPage() {
  const [friendsPage, setFriendsPage] = useState(1);
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 250);

  const friendsQuery = useFriends(friendsPage, PAGE_SIZE, debouncedQuery);
  const incomingQuery = useIncomingRequests();
  const outgoingQuery = useOutgoingRequests();
  const blockedQuery = useBlockedUsers();
  const incomingCountQuery = useIncomingRequestsCount(true);

  const friends = friendsQuery.data?.data ?? [];
  const friendsTotal = friendsQuery.data?.pagination.total ?? 0;
  const incoming = incomingQuery.data?.data ?? [];
  const outgoing = outgoingQuery.data?.data ?? [];
  const blocked = blockedQuery.data?.data ?? [];
  const incomingBadge = incomingCountQuery.data ?? incoming.length;

  const totalPages = useMemo(
    () => friendsQuery.data?.pagination.totalPages ?? 1,
    [friendsQuery.data?.pagination.totalPages],
  );

  const loading =
    friendsQuery.isLoading ||
    incomingQuery.isLoading ||
    outgoingQuery.isLoading ||
    blockedQuery.isLoading;

  const refreshLists = () => {
    void friendsQuery.refetch();
    void incomingQuery.refetch();
    void outgoingQuery.refetch();
    void blockedQuery.refetch();
    void incomingCountQuery.refetch();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Друзья</h1>
        <p className="text-sm text-muted-foreground">Управляйте друзьями и запросами</p>
      </div>

      <Tabs defaultValue="friends">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="friends">Друзья ({friendsTotal})</TabsTrigger>
          <TabsTrigger value="incoming" className="gap-1.5">
            Входящие
            {incomingBadge > 0 ? (
              <Badge variant="destructive" className="h-5 min-w-5 px-1.5">
                {incomingBadge}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="outgoing">Исходящие ({outgoing.length})</TabsTrigger>
          <TabsTrigger value="blocked">Заблокированные ({blocked.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setFriendsPage(1);
              }}
              placeholder="Поиск по нику"
              className="pl-9"
            />
          </div>

          {friends.length === 0 ? (
            <EmptyState
              icon={Users}
              title="У вас пока нет друзей"
              description="Найдите игроков в профилях и отправьте запрос"
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {friends.map((item) => (
                <FriendCard key={item.id} friend={item.user} onRemoved={refreshLists} onBlocked={refreshLists} />
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={friendsPage <= 1 || friendsQuery.isFetching}
                onClick={() => setFriendsPage((p) => Math.max(1, p - 1))}
              >
                Назад
              </Button>
              <span className="text-sm text-muted-foreground">
                {friendsPage} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={friendsPage >= totalPages || friendsQuery.isFetching}
                onClick={() => setFriendsPage((p) => p + 1)}
              >
                Вперёд
              </Button>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="incoming" className="mt-4 space-y-3">
          {incoming.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Нет входящих запросов"
              description="Здесь появятся запросы в друзья"
            />
          ) : (
            incoming.map((request) => (
              <FriendRequestCard key={request.id} request={request} type="incoming" onDone={refreshLists} />
            ))
          )}
        </TabsContent>

        <TabsContent value="outgoing" className="mt-4 space-y-3">
          {outgoing.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Нет исходящих запросов"
              description="Отправленные запросы появятся здесь"
            />
          ) : (
            outgoing.map((request) => (
              <FriendRequestCard key={request.id} request={request} type="outgoing" onDone={refreshLists} />
            ))
          )}
        </TabsContent>

        <TabsContent value="blocked" className="mt-4 space-y-3">
          {blocked.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Нет заблокированных"
              description="Заблокированные игроки появятся здесь"
            />
          ) : (
            blocked.map((item) => (
              <BlockedUserCard key={item.id} item={item} onUnblocked={refreshLists} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
