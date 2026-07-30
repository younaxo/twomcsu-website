'use client';

import {
  NEWS_CATEGORY_LABELS,
  NEWS_SORT_LABELS,
  NewsCategory,
  NewsSort,
} from '@twomc/shared';
import { Rss, Search } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { NewsCard } from '@/components/news/NewsCard';
import { NewsFeaturedBanner } from '@/components/news/NewsFeaturedBanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useNews, useNewsFeatured, useNewsPopular, useNewsTags } from '@/hooks/news';

const CATEGORY_TABS: Array<{ value: NewsCategory | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Все' },
  { value: NewsCategory.UPDATE, label: NEWS_CATEGORY_LABELS.UPDATE },
  { value: NewsCategory.EVENT, label: NEWS_CATEGORY_LABELS.EVENT },
  { value: NewsCategory.GUIDE, label: NEWS_CATEGORY_LABELS.GUIDE },
  { value: NewsCategory.ANNOUNCEMENT, label: NEWS_CATEGORY_LABELS.ANNOUNCEMENT },
  { value: NewsCategory.PATCH_NOTES, label: NEWS_CATEGORY_LABELS.PATCH_NOTES },
  { value: NewsCategory.COMMUNITY, label: NEWS_CATEGORY_LABELS.COMMUNITY },
];

export default function NewsPage() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<NewsCategory | 'ALL'>('ALL');
  const [sort, setSort] = useState<NewsSort>(NewsSort.NEWEST);
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');

  const filters = useMemo(
    () => ({
      page,
      limit: 10,
      sort,
      ...(category !== 'ALL' ? { category } : {}),
      ...(search ? { search } : {}),
      ...(tag ? { tag } : {}),
    }),
    [page, sort, category, search, tag],
  );

  const list = useNews(filters);
  const featured = useNewsFeatured();
  const tags = useNewsTags(12);
  const popular = useNewsPopular();
  const discussed = popular.data?.slice().sort((a, b) => b.commentsCount - a.commentsCount).slice(0, 5) ?? [];

  const banner = featured.data?.[0] ?? null;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl glass-strong p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Новости TWOMC</h1>
            <p className="mt-2 text-muted-foreground">Обновления, события и объявления</p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <a href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/rss/news`} target="_blank" rel="noreferrer">
              <Rss className="mr-2 h-4 w-4" />
              RSS
            </a>
          </Button>
        </div>
      </section>

      {banner ? <NewsFeaturedBanner news={banner} /> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="space-y-3 rounded-2xl glass-medium p-4">
            <form
              className="relative"
              onSubmit={(e) => {
                e.preventDefault();
                setSearch(searchInput.trim());
                setPage(1);
              }}
            >
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Поиск новостей..."
                className="pl-9"
              />
            </form>

            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_TABS.map((tab) => (
                <Button
                  key={tab.value}
                  type="button"
                  size="sm"
                  variant={category === tab.value ? 'default' : 'secondary'}
                  onClick={() => {
                    setCategory(tab.value);
                    setPage(1);
                  }}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(NEWS_SORT_LABELS) as NewsSort[]).map((value) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={sort === value ? 'default' : 'ghost'}
                  onClick={() => {
                    setSort(value);
                    setPage(1);
                  }}
                >
                  {NEWS_SORT_LABELS[value]}
                </Button>
              ))}
            </div>

            {tag ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Тег:</span>
                <span className="text-primary">#{tag}</span>
                <Button type="button" size="sm" variant="ghost" onClick={() => setTag(null)}>
                  Сбросить
                </Button>
              </div>
            ) : null}
          </div>

          {list.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-72 w-full" />
              <Skeleton className="h-72 w-full" />
            </div>
          ) : list.data?.data.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {list.data.data.map((item) => (
                <NewsCard key={item.id} news={item} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl glass-medium p-10 text-center text-muted-foreground">
              Пока нет новостей
            </div>
          )}

          {list.data && list.data.pagination.totalPages > 1 ? (
            <div className="flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={!list.data.pagination.hasPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Назад
              </Button>
              <span className="text-sm text-muted-foreground">
                {list.data.pagination.page} / {list.data.pagination.totalPages}
              </span>
              <Button
                type="button"
                variant="secondary"
                disabled={!list.data.pagination.hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                Далее
              </Button>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl glass-medium p-4">
            <h2 className="mb-3 text-sm font-semibold text-white">Популярные теги</h2>
            <div className="flex flex-wrap gap-2">
              {tags.data?.map((item) => (
                <button
                  key={item.tag}
                  type="button"
                  onClick={() => {
                    setTag(item.tag);
                    setPage(1);
                  }}
                  className="rounded-md border border-border bg-secondary/40 px-2 py-1 text-xs text-muted-foreground transition-opacity hover:opacity-80"
                >
                  #{item.tag} · {item.count}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl glass-medium p-4">
            <h2 className="mb-3 text-sm font-semibold text-white">Самые обсуждаемые</h2>
            <ul className="space-y-2">
              {discussed.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/news/${item.slug}`}
                    className="block text-sm text-muted-foreground transition-opacity hover:opacity-80"
                  >
                    <span className="text-white">{item.title}</span>
                    <span className="mt-0.5 block text-xs">{item.commentsCount} комм.</span>
                  </Link>
                </li>
              ))}
              {!discussed.length ? (
                <li className="text-sm text-muted-foreground">Пока пусто</li>
              ) : null}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
