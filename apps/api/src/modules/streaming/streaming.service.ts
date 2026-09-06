import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StreamPlatform } from '@prisma/client';
import type { StreamChannel as StreamChannelView } from '@twomc/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStreamChannelDto, UpdateStreamChannelDto } from './dto/streaming.dto';

type TwitchStream = {
  user_login: string;
  title: string;
  viewer_count: number;
  started_at: string;
  thumbnail_url: string;
};

type YouTubeSearchItem = {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    liveBroadcastContent?: string;
    thumbnails?: { high?: { url?: string } };
  };
};

@Injectable()
export class StreamingService {
  private readonly logger = new Logger(StreamingService.name);
  private twitchToken: { value: string; expiresAt: number } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async publicList(): Promise<StreamChannelView[]> {
    const rows = await this.prisma.streamChannel.findMany({
      where: { isActive: true },
      orderBy: [
        { isLive: 'desc' },
        { isPartner: 'desc' },
        { viewerCount: 'desc' },
        { displayName: 'asc' },
      ],
    });
    return rows.map((row) => this.map(row, false));
  }

  async adminList(): Promise<StreamChannelView[]> {
    const rows = await this.prisma.streamChannel.findMany({
      orderBy: [{ isLive: 'desc' }, { isPartner: 'desc' }, { displayName: 'asc' }],
    });
    return rows.map((row) => this.map(row, true));
  }

  async create(dto: CreateStreamChannelDto): Promise<StreamChannelView> {
    const row = await this.prisma.streamChannel.create({
      data: {
        ...dto,
        channelKey: dto.channelKey.trim().replace(/^@/, ''),
        displayName: dto.displayName.trim(),
      },
    });
    return this.map(row, true);
  }

  async update(id: string, dto: UpdateStreamChannelDto): Promise<StreamChannelView> {
    const row = await this.prisma.streamChannel.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.channelKey ? { channelKey: dto.channelKey.trim().replace(/^@/, '') } : {}),
        ...(dto.displayName ? { displayName: dto.displayName.trim() } : {}),
      },
    });
    return this.map(row, true);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.streamChannel.delete({ where: { id } });
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async refresh(): Promise<{ checked: number; live: number }> {
    const channels = await this.prisma.streamChannel.findMany({ where: { isActive: true } });
    const twitch = channels.filter((item) => item.platform === StreamPlatform.TWITCH);
    const youtube = channels.filter((item) => item.platform === StreamPlatform.YOUTUBE);
    await Promise.all([this.refreshTwitch(twitch), this.refreshYouTube(youtube)]);
    const live = await this.prisma.streamChannel.count({ where: { isActive: true, isLive: true } });
    return { checked: channels.length, live };
  }

  private async refreshTwitch(
    channels: Array<{ id: string; channelKey: string; channelUrl: string; isPartner: boolean }>,
  ) {
    if (!channels.length) return;
    const clientId = this.config.get<string>('streaming.twitchClientId') ?? '';
    const secret = this.config.get<string>('streaming.twitchClientSecret') ?? '';
    if (!clientId || !secret) {
      await this.setPlatformError(StreamPlatform.TWITCH, 'Twitch API не настроен');
      return;
    }
    try {
      const token = await this.getTwitchToken(clientId, secret);
      const params = new URLSearchParams();
      channels.forEach((channel) => params.append('user_login', channel.channelKey));
      const response = await fetch(`https://api.twitch.tv/helix/streams?${params}`, {
        headers: { Authorization: `Bearer ${token}`, 'Client-Id': clientId },
      });
      if (!response.ok) throw new Error(`Twitch API: ${response.status}`);
      const payload = (await response.json()) as { data?: TwitchStream[] };
      const streams = new Map(
        (payload.data ?? []).map((item) => [item.user_login.toLowerCase(), item]),
      );
      await Promise.all(
        channels.map((channel) => {
          const stream = streams.get(channel.channelKey.toLowerCase());
          const live = Boolean(stream && (channel.isPartner || this.matchesProject(stream.title)));
          return this.prisma.streamChannel.update({
            where: { id: channel.id },
            data: {
              isLive: live,
              title: live ? stream?.title : null,
              thumbnailUrl: live
                ? stream?.thumbnail_url.replace('{width}', '640').replace('{height}', '360')
                : null,
              liveUrl: live ? channel.channelUrl : null,
              viewerCount: live ? (stream?.viewer_count ?? 0) : 0,
              startedAt: live && stream?.started_at ? new Date(stream.started_at) : null,
              lastCheckedAt: new Date(),
              checkError: null,
            },
          });
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка Twitch API';
      this.logger.warn(message);
      await this.setPlatformError(StreamPlatform.TWITCH, message);
    }
  }

  private async refreshYouTube(
    channels: Array<{ id: string; channelKey: string; channelUrl: string; isPartner: boolean }>,
  ) {
    if (!channels.length) return;
    const apiKey = this.config.get<string>('streaming.youtubeApiKey') ?? '';
    if (!apiKey) {
      await this.setPlatformError(StreamPlatform.YOUTUBE, 'YouTube API не настроен');
      return;
    }
    await Promise.all(
      channels.map(async (channel) => {
        try {
          const params = new URLSearchParams({
            part: 'snippet',
            channelId: channel.channelKey,
            eventType: 'live',
            type: 'video',
            maxResults: '1',
            key: apiKey,
          });
          const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
          if (!response.ok) throw new Error(`YouTube API: ${response.status}`);
          const payload = (await response.json()) as { items?: YouTubeSearchItem[] };
          const video = payload.items?.[0];
          const title = video?.snippet?.title ?? '';
          const videoId = video?.id?.videoId;
          const live = Boolean(videoId && (channel.isPartner || this.matchesProject(title)));
          await this.prisma.streamChannel.update({
            where: { id: channel.id },
            data: {
              isLive: live,
              title: live ? title : null,
              thumbnailUrl: live ? (video?.snippet?.thumbnails?.high?.url ?? null) : null,
              liveUrl: live ? `https://www.youtube.com/watch?v=${videoId}` : null,
              viewerCount: 0,
              startedAt: null,
              lastCheckedAt: new Date(),
              checkError: null,
            },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Ошибка YouTube API';
          await this.prisma.streamChannel.update({
            where: { id: channel.id },
            data: { lastCheckedAt: new Date(), checkError: message.slice(0, 500) },
          });
        }
      }),
    );
  }

  private async getTwitchToken(clientId: string, secret: string): Promise<string> {
    if (this.twitchToken && this.twitchToken.expiresAt > Date.now() + 60_000)
      return this.twitchToken.value;
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: secret,
      grant_type: 'client_credentials',
    });
    const response = await fetch(`https://id.twitch.tv/oauth2/token?${params}`, { method: 'POST' });
    if (!response.ok) throw new Error(`Twitch OAuth: ${response.status}`);
    const payload = (await response.json()) as { access_token: string; expires_in: number };
    this.twitchToken = {
      value: payload.access_token,
      expiresAt: Date.now() + payload.expires_in * 1000,
    };
    return payload.access_token;
  }

  private matchesProject(title: string): boolean {
    return title.toLowerCase().includes('twomc.su');
  }

  private async setPlatformError(platform: StreamPlatform, error: string) {
    await this.prisma.streamChannel.updateMany({
      where: { platform, isActive: true },
      data: { lastCheckedAt: new Date(), checkError: error.slice(0, 500) },
    });
  }

  private map(
    row: {
      id: string;
      platform: StreamPlatform;
      channelKey: string;
      channelUrl: string;
      displayName: string;
      avatarUrl: string | null;
      isPartner: boolean;
      isActive: boolean;
      isLive: boolean;
      title: string | null;
      thumbnailUrl: string | null;
      liveUrl: string | null;
      viewerCount: number;
      startedAt: Date | null;
      lastCheckedAt: Date | null;
      checkError: string | null;
    },
    admin: boolean,
  ): StreamChannelView {
    return {
      ...row,
      startedAt: row.startedAt?.toISOString() ?? null,
      lastCheckedAt: row.lastCheckedAt?.toISOString() ?? null,
      ...(admin ? { checkError: row.checkError } : {}),
    };
  }
}
