import { defineRouting } from 'next-intl/routing';

// Locale metadata used across the switcher, hreflang tags and <html lang>.
export const localeNames: Record<string, string> = {
  ru: 'Русский',
  uk: 'Українська',
  en: 'English',
};

export const routing = defineRouting({
  locales: ['ru', 'uk', 'en'],
  defaultLocale: 'ru',
  // Default locale keeps clean URLs (/store); uk/en get a /uk, /en prefix.
  localePrefix: 'as-needed',
  localeCookie: {
    name: 'NEXT_LOCALE',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  },
});

export type AppLocale = (typeof routing.locales)[number];
