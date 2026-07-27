'use client';

import type { StoreProduct } from '@twomc/shared';
import { Package } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { ProductCard } from '@/components/store/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductGridProps {
  products: StoreProduct[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
}

export function ProductGrid({
  products,
  isLoading,
  emptyMessage = 'Товары не найдены',
  emptyDescription = 'Попробуйте изменить фильтры',
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title={emptyMessage}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
