import { MediaGroup, SocialPlatform, UserBadgeType } from '@twomc/shared';

export const userBadgeLabels: Record<UserBadgeType, string> = {
  VERIFIED: 'Верифицирован',
  SUBSCRIBER_PLUS: 'Подписчик Плюс',
  PROJECT_TEAM: 'Команда проекта',
  DEVELOPERS_TEAM: 'Developers Team',
};

export const userBadgeIcons: Record<UserBadgeType, string> = {
  VERIFIED: '/badges/verified.svg',
  SUBSCRIBER_PLUS: '/badges/subscriber-plus.svg',
  PROJECT_TEAM: '/badges/project-team.svg',
  DEVELOPERS_TEAM: '/badges/developers-team.svg',
};

export const socialPlatformLabels: Record<SocialPlatform, string> = {
  DISCORD: 'Discord',
  TELEGRAM: 'Telegram',
  VK: 'ВКонтакте',
  YOUTUBE: 'YouTube',
  TWITCH: 'Twitch',
  TIKTOK: 'TikTok',
  STEAM: 'Steam',
};

export const mediaGroupLabels: Record<MediaGroup, string> = {
  YOUTUBE: 'YouTube',
  TWITCH: 'Twitch',
  TIKTOK: 'TikTok',
};

export const genderLabels = {
  MALE: 'Мужской',
  FEMALE: 'Женский',
  OTHER: 'Другой',
  PREFER_NOT_TO_SAY: 'Не указывать',
} as const;

export const profileReportLabels = {
  SPAM: 'Спам',
  INAPPROPRIATE_CONTENT: 'Неприемлемый контент',
  HARASSMENT: 'Оскорбления',
  IMPERSONATION: 'Выдаёт себя за другого',
  OTHER: 'Другое',
} as const;

export const rarityBorder: Record<string, string> = {
  common: 'border-zinc-500',
  rare: 'border-blue-500',
  epic: 'border-purple-500',
  legendary: 'border-amber-400',
};

/** Uploaded files come as /uploads/... and must hit the api host */
export function resolveMediaUrl(path: string | null | undefined): string | undefined {
  if (!path) {
    return undefined;
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  if (path.startsWith('/uploads/')) {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    return `${base}${path}`;
  }

  return path;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value);
}

export const popularCountries = [
  'Россия',
  'Беларусь',
  'Казахстан',
  'Украина',
  'Узбекистан',
  'Кыргызстан',
  'Армения',
  'Азербайджан',
  'Грузия',
  'Молдова',
  'Германия',
  'Польша',
  'Турция',
  'США',
  'Другая',
] as const;
