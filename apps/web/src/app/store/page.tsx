'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BundleCard } from '@/components/store/BundleCard';
import { CartDrawer } from '@/components/store/CartDrawer';
import { CategoryTree } from '@/components/store/CategoryTree';
import { ProductGrid } from '@/components/store/ProductGrid';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBundles, useCategories, useProducts } from '@/hooks/store';
import type { StoreSort } from '@/stores/storeUiStore';
import { useStoreUiStore } from '@/stores/storeUiStore';

type TabId = 'all' | 'game' | 'site' | 'bundles';

const SORT_OPTIONS: { value: StoreSort; label: string }[] = [
  { value: 'popular', label: 'По популярности' },
  { value: 'newest', label: 'Новинки' },
  { value: 'price_asc', label: 'Сначала дешевле' },
  { value: 'price_desc', label: 'Сначала дороже' },
];

export default function StorePage() {
  const [tab, setTab] = useState<TabId>('all');
  const [page, setPage] = useState(1);
  const filters = useStoreUiStore((s) => s.filters);
  const setCategory = useStoreUiStore((s) => s.setCategory);
  const setSort = useStoreUiStore((s) => s.setSort);

  const categories = useCategories();
  const products = useProducts({
    category: tab === 'bundles' ? null : filters.category,
    page,
    limit: 24,
    sort: filters.sort,
    enabled: tab !== 'bundles',
  });
  const bundles = useBundles(tab === 'bundles' || tab === 'all');

  const rootCategories = categories.data ?? [];
  const filteredTree =
    tab === 'game'
      ? rootCategories.filter((c) => c.slug === 'game' || c.slug === 'games')
      : tab === 'site'
        ? rootCategories.filter((c) => c.slug === 'site')
        : rootCategories.filter((c) => c.slug !== 'bundles');

  const items = products.data?.items ?? [];
  const totalPages = products.data?.totalPages ?? 1;

  return (
    <div className="space-y-8">
      <CartDrawer />

      <section className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/10 p-8 sm:p-10">
        <p className="mb-2 text-sm uppercase tracking-widest text-primary">Магазин</p>
        <h1 className="mb-3 text-3xl font-semibold text-white sm:text-4xl">Магазин TWOMC</h1>
        <p className="max-w-xl text-muted-foreground">
          Привилегии, ключи, валюта и наборы для сервера. Покупай себе или дари друзьям.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/store/currency">Купить валюту</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/store/cart">Корзина</Link>
          </Button>
        </div>
      </section>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as TabId);
          setPage(1);
          setCategory(null);
        }}
      >
        <TabsList>
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="game">Игровые</TabsTrigger>
          <TabsTrigger value="site">Сайт</TabsTrigger>
          <TabsTrigger value="bundles">Наборы</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'bundles' ? (
        <div className="space-y-4">
          {bundles.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(bundles.data ?? []).map((bundle) => (
                <BundleCard key={bundle.id} bundle={bundle} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <aside className="rounded-xl border border-border bg-card/50 p-3">
            {categories.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <CategoryTree
                categories={filteredTree}
                activeSlug={filters.category}
                onSelect={(slug) => {
                  setCategory(slug);
                  setPage(1);
                }}
              />
            )}
          </aside>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {products.data ? `${products.data.total} товаров` : '—'}
              </p>
              <Select
                value={filters.sort}
                onValueChange={(v) => {
                  setSort(v as StoreSort);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Сортировка" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ProductGrid products={items} isLoading={products.isLoading} />

            {totalPages > 1 ? (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Назад
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Далее
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
