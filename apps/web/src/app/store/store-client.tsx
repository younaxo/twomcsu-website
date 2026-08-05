'use client';

import type { ProductType } from '@twomc/shared';
import { Package, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { BundleCard } from '@/components/store/BundleCard';
import { CurrencyConverter } from '@/components/store/CurrencyConverter';
import { ProductGrid } from '@/components/store/ProductGrid';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useBundles,
  useProducts,
  useRecentPurchases,
} from '@/hooks/store';
import { resolveMediaUrl } from '@/lib/profile';
import type { StoreSort } from '@/stores/storeUiStore';
import { useStoreUiStore } from '@/stores/storeUiStore';

type StoreTab =
  | 'all'
  | 'privileges'
  | 'keys'
  | 'currency'
  | 'decorations'
  | 'bundles'
  | 'other';

const TAB_TYPES: Record<Exclude<StoreTab, 'all' | 'bundles' | 'currency' | 'other'>, ProductType> = {
  privileges: 'PRIVILEGE',
  keys: 'KEY',
  decorations: 'DECORATION',
};

const OTHER_TYPES: ProductType[] = [
  'SUBSCRIPTION',
  'BADGE',
  'BATTLE_PASS',
  'BATTLE_PASS_BOOSTER',
  'UNMUTE',
  'UNBAN',
];

const SORT_OPTIONS: { value: StoreSort; label: string }[] = [
  { value: 'popular', label: 'По популярности' },
  { value: 'newest', label: 'Новинки' },
  { value: 'price_asc', label: 'Сначала дешевле' },
  { value: 'price_desc', label: 'Сначала дороже' },
];

function useDebounced(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function StorePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as StoreTab | null) ?? 'all';
  const [tab, setTab] = useState<StoreTab>(
    [
      'all',
      'privileges',
      'keys',
      'currency',
      'decorations',
      'bundles',
      'other',
    ].includes(initialTab)
      ? initialTab
      : 'all',
  );
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 300);
  const filters = useStoreUiStore((s) => s.filters);
  const setSort = useStoreUiStore((s) => s.setSort);

  const productType =
    tab === 'privileges' || tab === 'keys' || tab === 'decorations'
      ? TAB_TYPES[tab]
      : tab === 'currency'
        ? ('CURRENCY' as ProductType)
        : null;

  const products = useProducts({
    type: productType,
    search: debouncedSearch || null,
    page,
    limit: 24,
    sort: filters.sort,
    enabled: tab !== 'bundles' && tab !== 'currency',
  });

  const currencyProducts = useProducts({
    type: 'CURRENCY',
    limit: 20,
    enabled: tab === 'currency',
  });
  const bundles = useBundles(tab === 'bundles' || tab === 'all');
  const recent = useRecentPurchases(12, true);

  const filteredItems = useMemo(() => {
    const items = products.data?.items ?? [];
    if (tab !== 'other') return items;
    return items.filter((p) => OTHER_TYPES.includes(p.type));
  }, [products.data?.items, tab]);

  const totalPages = products.data?.totalPages ?? 1;
  const rubies = currencyProducts.data?.items.find((p) => p.currencyType === 'RUBIES');
  const coins = currencyProducts.data?.items.find((p) => p.currencyType === 'COINS');

  const changeTab = (next: StoreTab) => {
    setTab(next);
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'all') params.delete('tab');
    else params.set('tab', next);
    router.replace(`/store${params.toString() ? `?${params}` : ''}`, { scroll: false });
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/10 p-8 sm:p-10">
        <p className="mb-2 text-sm uppercase tracking-widest text-primary">Магазин</p>
        <h1 className="mb-3 text-3xl font-semibold text-white sm:text-4xl">Магазин TWOMC</h1>
        <p className="max-w-xl text-muted-foreground">
          Привилегии, ключи, валюта и наборы для сервера. Покупай себе или дари друзьям.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={() => changeTab('currency')}>Купить валюту</Button>
          <Button variant="secondary" asChild>
            <Link href="/store/cart">Корзина</Link>
          </Button>
        </div>
      </section>

      {recent.data && recent.data.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Недавние покупки</h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {recent.data.map((item) => {
              const img = resolveMediaUrl(item.productImage);
              return (
                <div
                  key={item.id}
                  className="flex min-w-[180px] items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-2"
                >
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-secondary">
                    {img ? (
                      <Image src={img} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <ShoppingBag className="m-2 h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-white">{item.productName}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {item.username ?? 'Гость'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => changeTab(v as StoreTab)} className="w-full">
          <TabsList className="flex h-auto flex-wrap justify-start gap-1">
            <TabsTrigger value="all">Все</TabsTrigger>
            <TabsTrigger value="privileges">Привилегии</TabsTrigger>
            <TabsTrigger value="keys">Ключи</TabsTrigger>
            <TabsTrigger value="currency">Валюта</TabsTrigger>
            <TabsTrigger value="decorations">Украшения аватарок</TabsTrigger>
            <TabsTrigger value="bundles">Наборы</TabsTrigger>
            <TabsTrigger value="other">Другое</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {tab !== 'currency' && tab !== 'bundles' ? (
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Поиск товаров…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-sm"
          />
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
          <p className="text-sm text-muted-foreground">
            {products.data ? `${products.data.total} товаров` : '—'}
          </p>
        </div>
      ) : null}

      {tab === 'currency' ? (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white">Валюта</h2>

          {currencyProducts.isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <CurrencyConverter
              rubiesProductId={rubies?.id}
              rubiesVariantId={rubies?.variants[0]?.id}
              coinsProductId={coins?.id}
              coinsVariantId={coins?.variants[0]?.id}
            />
          )}
        </div>
      ) : tab === 'bundles' ? (
        <div className="space-y-4">
          {bundles.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-xl" />
              ))}
            </div>
          ) : (bundles.data ?? []).length === 0 ? (
            <EmptyState icon={Package} title="Наборов пока нет" description="Загляните позже" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(bundles.data ?? []).map((bundle) => (
                <BundleCard key={bundle.id} bundle={bundle} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {!products.isLoading && filteredItems.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="Ничего не найдено"
              description="Попробуйте изменить поиск или вкладку"
            />
          ) : (
            <ProductGrid products={filteredItems} isLoading={products.isLoading} />
          )}

          {totalPages > 1 && tab !== 'other' ? (
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
      )}

      {tab === 'all' && (bundles.data?.length ?? 0) > 0 ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Наборы</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {bundles.data!.slice(0, 4).map((bundle) => (
              <BundleCard key={bundle.id} bundle={bundle} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
