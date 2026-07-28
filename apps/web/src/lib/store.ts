import type { ProductDuration, ProductType } from '@twomc/shared';
import { DURATION_LABELS } from '@twomc/shared';

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  PRIVILEGE: 'Привилегия',
  KEY: 'Ключ',
  SUBSCRIPTION: 'Подписка',
  BADGE: 'Значок',
  BATTLE_PASS: 'Боевой пропуск',
  BATTLE_PASS_BOOSTER: 'Усилитель БП',
  UNMUTE: 'Размут',
  UNBAN: 'Разбан',
  CURRENCY: 'Валюта',
  DECORATION: 'Украшение',
  BUNDLE: 'Набор',
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ожидает оплаты',
  COMPLETED: 'Оплачен',
  FAILED: 'Ошибка',
  CANCELLED: 'Отменён',
  REFUNDED: 'Возврат',
};

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDuration(duration: ProductDuration): string {
  return DURATION_LABELS[duration] ?? duration;
}

export function discountPercent(price: number, oldPrice: number | null | undefined): number | null {
  if (!oldPrice || oldPrice <= price) return null;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

/** Fallback bulk discounts for currency page when API is unavailable */
export const CURRENCY_BULK_FALLBACK = [
  { minAmount: 500, bonusPercent: 5 },
  { minAmount: 1000, bonusPercent: 10 },
  { minAmount: 3000, bonusPercent: 15 },
  { minAmount: 5000, bonusPercent: 20 },
] as const;

export const KEY_BULK_FALLBACK = [
  { minQuantity: 10, discountPercent: 10 },
  { minQuantity: 20, discountPercent: 20 },
] as const;
