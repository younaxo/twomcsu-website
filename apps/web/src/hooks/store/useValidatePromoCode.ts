'use client';

import type { PromoValidationResult } from '@twomc/shared';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useValidatePromoCode() {
  return useMutation({
    mutationFn: async (code: string) => {
      const { data } = await api.post<PromoValidationResult>('/store/promocodes/validate', {
        code,
      });
      return data;
    },
  });
}
