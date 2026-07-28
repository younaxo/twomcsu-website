'use client';

import { Server } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/EmptyState';
import { PlayersList } from '@/components/servers/PlayersList';
import { ServerCard } from '@/components/servers/ServerCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useServer,
  useServerHistory,
  useServerPlayers,
} from '@/hooks/servers';

const ServerHistoryChart = dynamic(
  () =>
    import('@/components/servers/ServerHistoryChart').then((mod) => mod.ServerHistoryChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-72 w-full" />,
  },
);

export default function ServerDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [historyDays, setHistoryDays] = useState(1);
  const server = useServer(slug);
  const players = useServerPlayers(slug, Boolean(server.data));
  const history = useServerHistory(slug, historyDays, Boolean(server.data));

  if (server.isLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  if (server.isError || !server.data) {
    return (
      <EmptyState
        icon={Server}
        title="Сервер не найден"
        description="Проверьте адрес или вернитесь к списку"
        action={
          <Button asChild variant="secondary">
            <Link href="/servers">Все серверы</Link>
          </Button>
        }
      />
    );
  }

  const play = async () => {
    const ip = `${server.data.address}:${server.data.port}`;
    try {
      await navigator.clipboard.writeText(ip);
      toast.success('Адрес скопирован', {
        description: 'В Minecraft → Мультиплеер → Добавить сервер',
      });
    } catch {
      toast.error('Не удалось скопировать адрес');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/servers">← Все серверы</Link>
        </Button>
        <Button size="lg" onClick={() => void play()}>
          Играть
        </Button>
      </div>

      <ServerCard server={server.data} />

      <Tabs defaultValue="players">
        <TabsList>
          <TabsTrigger value="players">Игроки онлайн</TabsTrigger>
          <TabsTrigger value="history">История онлайна</TabsTrigger>
          <TabsTrigger value="info">Информация</TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="mt-4">
          {players.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <PlayersList players={players.data ?? []} />
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-4">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={historyDays === 1 ? 'default' : 'secondary'}
              onClick={() => setHistoryDays(1)}
            >
              24 часа
            </Button>
            <Button
              size="sm"
              variant={historyDays === 7 ? 'default' : 'secondary'}
              onClick={() => setHistoryDays(7)}
            >
              7 дней
            </Button>
          </div>
          {history.isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <ServerHistoryChart data={history.data ?? []} days={historyDays} />
          )}
        </TabsContent>

        <TabsContent value="info" className="mt-4 space-y-3 rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Тип: {server.data.type}</p>
          <p className="whitespace-pre-wrap text-sm text-white">
            {server.data.description || 'Описание пока не добавлено'}
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
