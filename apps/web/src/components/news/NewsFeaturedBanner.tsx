'use client';

import type { NewsSummary } from '@twomc/shared';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { NewsCategoryBadge } from './NewsCategoryBadge';

interface NewsFeaturedBannerProps {
  news: NewsSummary;
}

export function NewsFeaturedBanner({ news }: NewsFeaturedBannerProps) {
  return (
    <Link
      href={`/news/${news.slug}`}
      className="group relative block overflow-hidden rounded-2xl glass-strong transition-opacity hover:opacity-95"
    >
      <div className="relative aspect-[21/9] min-h-[200px] w-full bg-secondary/40">
        {news.coverImage ? (
          <Image
            src={news.coverImage}
            alt={news.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
            unoptimized
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 space-y-3 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-white">Топ</span>
            <NewsCategoryBadge category={news.category} />
          </div>
          <h2 className="max-w-3xl text-2xl font-bold text-white sm:text-3xl">{news.title}</h2>
          {news.excerpt ? (
            <p className="max-w-2xl line-clamp-2 text-sm text-white/80 sm:text-base">{news.excerpt}</p>
          ) : null}
          <span className="inline-flex items-center gap-1 text-sm text-primary">
            Читать
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
