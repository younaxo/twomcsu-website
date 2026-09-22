import { COOKIE_CONSENT_VERSION, CookieConsentInput, CookieConsentRecord } from '@twomc/shared';

export const CONSENT_COOKIE = 'twomc_consent';
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export const defaultConsent: CookieConsentInput = {
  analytics: false,
  marketing: false,
  preferences: false,
};

/** Reads the local first-party consent cookie (guest state, also mirrors the signed-in choice) */
export function readConsentCookie(): CookieConsentRecord | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`));
  if (!match) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1])) as CookieConsentRecord;
    if (parsed.version !== COOKIE_CONSENT_VERSION) return null; // policy changed, ask again
    return parsed;
  } catch {
    return null;
  }
}

export function writeConsentCookie(input: CookieConsentInput): CookieConsentRecord {
  const record: CookieConsentRecord = {
    necessary: true,
    ...input,
    version: COOKIE_CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
  };
  if (typeof document !== 'undefined') {
    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(record))}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
  }
  return record;
}

/** Only necessary/analytics gate anything that actually runs today; kept generic for future vendors */
export function isCategoryAllowed(
  consent: CookieConsentRecord | null,
  category: keyof CookieConsentInput,
): boolean {
  return Boolean(consent?.[category]);
}
