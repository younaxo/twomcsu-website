'use client';

import type { ServersOverview } from '@twomc/shared';
import Link from 'next/link';
import { ServerStatusBadge } from '@/components/servers/ServerStatusBadge';

interface TopServersListProps {
  servers: ServersOverview['topServers'];
}

export function TopServersList({ servers }: TopServersListProps) {
  if (servers.length === 0) {
    return <p className="text-sm text-muted-foreground">Серверы пока не настроены</p>;
  }

  return (
    <ol className="space-y-2">
      {servers.map((server, index) => (
        <li key={server.id}>
          <Link
            href={`/servers/${server.slug}`}
            className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/30 px-3 py-2.5 transition-colors hover:bg-accent/40"
          >
            <span className="w-6 text-center text-sm font-semibold text-muted-foreground">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-white">{server.name}</p>
              <ServerStatusBadge
                online={server.online}
                playerCount={server.playerCount}
                showCount={false}
                className="text-xs"
              />
            </div>
            <span className="tabular-nums text-sm text-muted-foreground">
              {server.playerCount}/{server.maxPlayers}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
