'use client';

import type {
  BlockedUserItem,
  FriendListItem,
  FriendRequestItem,
  PaginatedResponse,
} from '@twomc/shared';
import { Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BlockedUserCard } from '@/components/shared/BlockedUserCard';
import { FriendCard } from '@/components/shared/FriendCard';
import { FriendRequestCard } from '@/components/shared/FriendRequestCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api, extractErrorMessage } from '@/lib/api';
import { useFriendsStore } from '@/stores/friendsStore';
import { toast } from 'sonner';

const PAGE_SIZE = 12;

export default function FriendsPage() {
  const refreshIncoming = useFriendsStore((s) => s.refresh);
  const incomingBadge = useFriendsStore((s) => s.incomingCount);

  const [friends, setFriends] = useState<FriendListItem[]>([]);
  const [friendsTotal, setFriendsTotal] = useState(0);
  const [friendsPage, setFriendsPage] = useState(1);
  const [incoming, setIncoming] = useState<FriendRequestItem[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequestItem[]>([]);
  const [blocked, setBlocked] = useState<BlockedUserItem[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadFriends = useCallback(async (page: number) => {
    const { data } = await api.get<PaginatedResponse<FriendListItem>>('/friends', {
      params: { page, limit: PAGE_SIZE },
    });
    setFriends(data.items);
    setFriendsTotal(data.total);
    setFriendsPage(data.page);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [incomingRes, outgoingRes, blockedRes] = await Promise.all([
        api.get<FriendRequestItem[]>('/friends/requests/incoming'),
        api.get<FriendRequestItem[]>('/friends/requests/outgoing'),
        api.get<BlockedUserItem[]>('/friends/blocked'),
        loadFriends(1),
        refreshIncoming(),
      ]);
      setIncoming(incomingRes.data);
      setOutgoing(outgoingRes.data);
      setBlocked(blockedRes.data);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить друзей'));
    } finally {
      setLoading(false);
    }
  }, [loadFriends, refreshIncoming]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const filteredFriends = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((item) => item.user.username.toLowerCase().includes(q));
  }, [friends, query]);

  const totalPages = Math.max(1, Math.ceil(friendsTotal / PAGE_SIZE));

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
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по нику"
              className="pl-9"
            />
          </div>

          {filteredFriends.length === 0 ? (
            <EmptyState text="У вас пока нет друзей" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredFriends.map((item) => (
                <FriendCard
                  key={item.id}
                  friend={item.user}
                  onRemoved={(username) => {
                    setFriends((prev) => prev.filter((row) => row.user.username !== username));
                    setFriendsTotal((n) => Math.max(0, n - 1));
                  }}
                  onBlocked={(username) => {
                    setFriends((prev) => prev.filter((row) => row.user.username !== username));
                    setFriendsTotal((n) => Math.max(0, n - 1));
                    void loadAll();
                  }}
                />
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={friendsPage <= 1}
                onClick={() => void loadFriends(friendsPage - 1)}
              >
                Назад
              </Button>
              <span className="text-sm text-muted-foreground">
                {friendsPage} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={friendsPage >= totalPages}
                onClick={() => void loadFriends(friendsPage + 1)}
              >
                Вперёд
              </Button>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="incoming" className="mt-4 space-y-3">
          {incoming.length === 0 ? (
            <EmptyState text="Нет входящих запросов" />
          ) : (
            incoming.map((request) => (
              <FriendRequestCard
                key={request.id}
                request={request}
                type="incoming"
                onDone={(id) => {
                  setIncoming((prev) => prev.filter((row) => row.id !== id));
                  void loadFriends(friendsPage);
                }}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="outgoing" className="mt-4 space-y-3">
          {outgoing.length === 0 ? (
            <EmptyState text="Нет исходящих запросов" />
          ) : (
            outgoing.map((request) => (
              <FriendRequestCard
                key={request.id}
                request={request}
                type="outgoing"
                onDone={(id) => setOutgoing((prev) => prev.filter((row) => row.id !== id))}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="blocked" className="mt-4 space-y-3">
          {blocked.length === 0 ? (
            <EmptyState text="Нет заблокированных" />
          ) : (
            blocked.map((item) => (
              <BlockedUserCard
                key={item.id}
                item={item}
                onUnblocked={(username) =>
                  setBlocked((prev) => prev.filter((row) => row.user.username !== username))
                }
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
