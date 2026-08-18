'use client';
/* eslint-disable @next/next/no-img-element */

import type { StreamChannel } from '@twomc/shared';
import { ExternalLink, Radio, Star, Tv, Users } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useStreams } from '@/hooks/useStreaming';

function StreamCard({ channel }: { channel: StreamChannel }) {
  return (
    <a
      href={channel.liveUrl ?? channel.channelUrl}
      target="_blank"
      rel="noreferrer"
      className="group block overflow-hidden rounded-2xl border border-white/10 glass-medium transition-colors hover:border-white/25"
    >
      <div className="relative aspect-video bg-black/30">
        {channel.thumbnailUrl ? (
          <img src={channel.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Tv className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        {channel.isLive ? (
          <Badge className="absolute left-3 top-3 bg-red-500 text-white hover:bg-red-500">
            <Radio className="mr-1 h-3 w-3" />
            LIVE
          </Badge>
        ) : null}
        {channel.viewerCount > 0 ? (
          <span className="absolute bottom-3 right-3 rounded-lg bg-black/70 px-2 py-1 text-xs text-white">
            <Users className="mr-1 inline h-3 w-3" />
            {channel.viewerCount.toLocaleString('ru-RU')}
          </span>
        ) : null}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2">
          <h2 className="min-w-0 flex-1 truncate font-semibold text-white">
            {channel.displayName}
          </h2>
          {channel.isPartner ? <Star className="h-4 w-4 fill-primary text-primary" /> : null}
          <ExternalLink className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {channel.title ?? (channel.isPartner ? 'Медиа-партнёр TWOMC' : 'Сейчас не в эфире')}
        </p>
        <Badge variant="secondary" className="mt-3">
          {channel.platform === 'TWITCH' ? 'Twitch' : 'YouTube'}
        </Badge>
      </div>
    </a>
  );
}

export default function StreamsPage() {
  const streams = useStreams();
  const live = streams.data?.filter((item) => item.isLive) ?? [];
  const partners = streams.data?.filter((item) => item.isPartner && !item.isLive) ?? [];
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <header className="relative overflow-hidden rounded-3xl border border-white/10 glass-strong p-6 sm:p-9">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-red-500/10 blur-3xl" />
        <div className="relative flex items-center gap-2 text-red-400">
          <Radio className="h-6 w-6" />
          <span className="text-sm uppercase tracking-[0.2em]">TWOMC в эфире</span>
        </div>
        <h1 className="font-display relative mt-4 text-3xl text-white sm:text-5xl">
          Стримы сообщества
        </h1>
        <p className="relative mt-3 max-w-2xl text-muted-foreground">
          Трансляции Twitch и YouTube с TWOMC. Медиа-партнёры отмечены звездой.
        </p>
      </header>
      {streams.isLoading ? (
        <div className="grid gap-5 md:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="aspect-video rounded-2xl" />
          ))}
        </div>
      ) : null}
      {!streams.isLoading && !streams.data?.length ? (
        <EmptyState
          icon={Radio}
          title="Пока никто не стримит"
          description="Здесь появятся прямые эфиры и медиа-партнёры проекта."
        />
      ) : null}
      {live.length ? (
        <section className="space-y-4">
          <h2 className="font-display text-2xl text-white">Сейчас в эфире</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {live.map((item) => (
              <StreamCard key={item.id} channel={item} />
            ))}
          </div>
        </section>
      ) : null}
      {partners.length ? (
        <section className="space-y-4">
          <h2 className="font-display text-2xl text-white">Медиа-партнёры</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {partners.map((item) => (
              <StreamCard key={item.id} channel={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
