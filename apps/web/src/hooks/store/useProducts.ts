'use client';

import type { ProductType, StoreProductsResponse } from '@twomc/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { StoreSort } from '@/stores/storeUiStore';

export interface ProductFilters {
  category?: string | null;
  type?: ProductType | null;
  search?: string | null;
  page?: number;
  limit?: number;
  sort?: StoreSort;
  enabled?: boolean;
}

export function useProducts({
  category,
  type,
  search,
  page = 1,
  limit = 24,
  sort = 'popular',
  enabled = true,
}: ProductFilters = {}) {
  const filters = {
    category: category ?? undefined,
    type: type ?? undefined,
    search: search || undefined,
    page,
    limit,
    sort,
  };

  return useQuery({
    queryKey: queryKeys.storeProducts(filters),
    queryFn: async () => {
      const { data } = await api.get<StoreProductsResponse>('/store/products', {
        params: filters,
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled,
  });
}
