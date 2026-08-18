export const DecorationAvailability = {
  STORE: 'STORE',
  ADMIN_ONLY: 'ADMIN_ONLY',
  UNAVAILABLE: 'UNAVAILABLE',
} as const;

export type DecorationAvailability =
  (typeof DecorationAvailability)[keyof typeof DecorationAvailability];

export const DecorationGrantSource = {
  PURCHASE: 'PURCHASE',
  ADMIN: 'ADMIN',
  LEGACY: 'LEGACY',
} as const;

export type DecorationGrantSource =
  (typeof DecorationGrantSource)[keyof typeof DecorationGrantSource];

export interface ProfileDecoration {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  availability: DecorationAvailability;
  isActive: boolean;
  order: number;
  owned?: boolean;
  selected?: boolean;
  product?: { id: string; slug: string; name: string; price: string } | null;
}

export interface OwnedProfileDecoration extends ProfileDecoration {
  owned: true;
  selected: boolean;
  acquiredAt: string;
  source: DecorationGrantSource;
}

export const decorationAvailabilityLabels: Record<DecorationAvailability, string> = {
  STORE: 'Доступно в магазине',
  ADMIN_ONLY: 'Только административная выдача',
  UNAVAILABLE: 'Недоступно',
};
