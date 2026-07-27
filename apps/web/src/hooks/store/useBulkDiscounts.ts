'use client';

import type { BulkDiscount } from '@twomc/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useBulkDiscounts(enabled = true) {
  return useQuery({
    queryKey: queryKeys.storeBulkDiscounts,
    queryFn: async () => {
      const { data } = await api.get<BulkDiscount[]>('/store/discounts/bulk', {
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled,
    retry: false,
  });
}
