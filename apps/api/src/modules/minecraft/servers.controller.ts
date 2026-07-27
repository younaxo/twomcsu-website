import {
  Controller,
  DefaultValuePipe,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import type {
  GameServer,
  ServerHistoryPoint,
  ServerPlayer,
  ServersOverview,
  ServerStatusSnapshot,
} from '@twomc/shared';
import { ServersService } from './servers.service';

@Controller('servers')
export class ServersController {
  constructor(private readonly servers: ServersService) {}

  @Get()
  list(): Promise<GameServer[]> {
    return this.servers.listActive();
  }

  @Get('overview')
  overview(): Promise<ServersOverview> {
    return this.servers.getOverview();
  }

  @Get('widget')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async widget(@Query('ids') ids?: string): Promise<string> {
    const list = await this.servers.listActive();
    const idSet = ids
      ? new Set(ids.split(',').map((s) => s.trim()).filter(Boolean))
      : null;
    const filtered = idSet
      ? list.filter((s) => idSet.has(s.id) || idSet.has(s.slug))
      : list;

    const rows = filtered
      .map((s) => {
        const online = s.status?.online ? 'online' : 'offline';
        const count = s.status?.playerCount ?? 0;
        const max = s.status?.maxPlayers ?? s.maxPlayers;
        return `<div class="twomc-server" data-slug="${s.slug}" data-status="${online}"><strong>${escapeHtml(s.name)}</strong> — ${count}/${max}</div>`;
      })
      .join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>.twomc-server{font:14px/1.4 system-ui,sans-serif;margin:4px 0}.twomc-server[data-status=online]{color:#16a34a}.twomc-server[data-status=offline]{color:#dc2626}</style></head><body>${rows || '<div>Нет серверов</div>'}</body></html>`;
  }

  @Get(':slug')
  getOne(@Param('slug') slug: string): Promise<GameServer> {
    return this.servers.getBySlug(slug);
  }

  @Get(':slug/status')
  status(@Param('slug') slug: string): Promise<ServerStatusSnapshot> {
    return this.servers.getStatus(slug);
  }

  @Get(':slug/players')
  players(@Param('slug') slug: string): Promise<ServerPlayer[]> {
    return this.servers.getPlayers(slug);
  }

  @Get(':slug/history')
  history(
    @Param('slug') slug: string,
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number,
  ): Promise<ServerHistoryPoint[]> {
    return this.servers.getHistory(slug, days);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
