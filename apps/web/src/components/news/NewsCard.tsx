'use client';

import type { NewsSummary } from '@twomc/shared';
import { Eye, Heart, MessageCircle, Pin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { cn } from '@/lib/utils';
import { NewsCategoryBadge } from './NewsCategoryBadge';

interface NewsCardProps {
  news: NewsSummary;
  compact?: boolean;
  className?: string;
}

export function NewsCard({ news, compact = false, className }: NewsCardProps) {
  const published = news.publishedAt
    ? formatDistanceToNow(new Date(news.publishedAt), { addSuffix: true, locale: ru })
    : null;

  return (
    <Link
      href={`/news/${news.slug}`}
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl glass-medium transition-opacity hover:opacity-90',
        className,
      )}
    >
      <div className={cn('relative w-full overflow-hidden bg-secondary/40', compact ? 'aspect-[16/9]' : 'aspect-[16/9]')}>
        {news.coverImage ? (
          <Image
            src={news.coverImage}
            alt={news.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">Нет обложки</div>
        )}
        <div className="absolute right-2 top-2 flex items-center gap-1.5">
          {news.isFeatured ? (
            <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-white">Топ</span>
          ) : null}
          <NewsCategoryBadge category={news.category} />
        </div>
        {news.isPinned ? (
          <Pin className="absolute left-2 top-2 h-4 w-4 text-white drop-shadow" />
        ) : null}
      </div>

      <div className={cn('flex flex-1 flex-col gap-2 p-4', compact && 'p-3')}>
        <h3
          className={cn(
            'font-semibold text-white line-clamp-2',
            compact ? 'text-base' : 'text-lg',
          )}
        >
          {news.title}
        </h3>
        {news.excerpt ? (
          <p className="line-clamp-3 text-sm text-muted-foreground">{news.excerpt}</p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-muted-foreground">
          <div className="flex min-w-0 items-center gap-2">
            {news.author.avatar ? (
              <Image
                src={news.author.avatar}
                alt=""
                width={20}
                height={20}
                className="rounded-full"
                unoptimized
              />
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px]">
                {news.author.username.slice(0, 1).toUpperCase()}
              </span>
            )}
            <ColoredUsername
              user={news.author}
              size="sm"
              showBadge={false}
              linkToProfile={false}
            />
            {published ? <span>· {published}</span> : null}
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {news.viewsCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {news.likesCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {news.commentsCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
