'use client';

import { NEWS_CATEGORY_LABELS } from '@twomc/shared';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ArrowUp, Eye, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { NewsAuthorInfo } from '@/components/news/NewsAuthorInfo';
import { NewsCategoryBadge } from '@/components/news/NewsCategoryBadge';
import { NewsCommentsList } from '@/components/news/NewsCommentsList';
import { extractToc, NewsContent } from '@/components/news/NewsContent';
import { NewsLikeButton } from '@/components/news/NewsLikeButton';
import { NewsRelated } from '@/components/news/NewsRelated';
import { NewsShareDialog } from '@/components/news/NewsShareDialog';
import { NewsTableOfContents } from '@/components/news/NewsTableOfContents';
import { NewsTagsList } from '@/components/news/NewsTagsList';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNews, useNewsBySlug } from '@/hooks/news';

interface NewsArticleClientProps {
  slug: string;
}

export function NewsArticleClient({ slug }: NewsArticleClientProps) {
  const detail = useNewsBySlug(slug);
  const related = useNews(
    {
      category: detail.data?.category,
      limit: 4,
      sort: 'newest',
    },
    Boolean(detail.data?.category),
  );

  const toc = useMemo(
    () => (detail.data ? extractToc(detail.data.content) : []),
    [detail.data],
  );

  if (detail.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!detail.data) {
    return (
      <div className="rounded-2xl glass-medium p-10 text-center">
        <p className="text-muted-foreground">Новость не найдена</p>
        <Button asChild className="mt-4" variant="secondary">
          <Link href="/news">К списку новостей</Link>
        </Button>
      </div>
    );
  }

  const news = detail.data;
  const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://twomc.su/news/${news.slug}`;
  const relatedItems =
    related.data?.data.filter((item) => item.id !== news.id).slice(0, 3) ?? [];

  return (
    <div className="space-y-8">
      <nav className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-white">
          Главная
        </Link>
        {' · '}
        <Link href="/news" className="hover:text-white">
          Новости
        </Link>
        {' · '}
        <Link href={`/news?category=${news.category}`} className="hover:text-white">
          {NEWS_CATEGORY_LABELS[news.category]}
        </Link>
        {' · '}
        <span className="text-white">{news.title}</span>
      </nav>

      <header className="space-y-4 rounded-2xl glass-strong p-6 sm:p-8">
        <NewsCategoryBadge category={news.category} />
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{news.title}</h1>
        {news.excerpt ? (
          <p className="text-lg italic text-muted-foreground">{news.excerpt}</p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <NewsAuthorInfo author={news.author} />
            {news.publishedAt ? (
              <p className="text-sm text-muted-foreground">
                {format(new Date(news.publishedAt), 'd MMMM yyyy, HH:mm', { locale: ru })}
              </p>
            ) : null}
            <NewsTagsList tags={news.tags} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <NewsLikeButton
              newsId={news.id}
              likesCount={news.likesCount}
              likedByMe={news.likedByMe}
            />
            <NewsShareDialog title={news.title} url={shareUrl} />
            <span className="inline-flex items-center gap-1 rounded-md bg-secondary/50 px-3 py-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              {news.viewsCount}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-secondary/50 px-3 py-2 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              {news.commentsCount}
            </span>
          </div>
        </div>
      </header>

      {news.coverImage ? (
        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl">
          <Image
            src={news.coverImage}
            alt={news.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
            unoptimized
          />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <NewsContent content={news.content} className="rounded-2xl glass-medium p-6" />
        <aside className="hidden space-y-4 lg:block">
          <div className="sticky top-24 space-y-4">
            <NewsLikeButton
              newsId={news.id}
              likesCount={news.likesCount}
              likedByMe={news.likedByMe}
              size="lg"
              className="w-full"
            />
            <NewsShareDialog title={news.title} url={shareUrl} />
            <NewsTableOfContents items={toc} />
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <ArrowUp className="mr-2 h-4 w-4" />
              Наверх
            </Button>
          </div>
        </aside>
      </div>

      <NewsRelated items={relatedItems} />

      <NewsCommentsList
        slug={news.slug}
        total={news.commentsCount}
        allowComments={news.allowComments}
      />
    </div>
  );
}
