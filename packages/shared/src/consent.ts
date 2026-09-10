/** Current cookie policy revision — bump when categories or their meaning change */
export const COOKIE_CONSENT_VERSION = '1.0';

export interface CookieConsentPreferences {
  /** Always true — session, auth and cart cookies can't be disabled */
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export interface CookieConsentRecord extends CookieConsentPreferences {
  version: string;
  updatedAt: string;
}

export type CookieConsentInput = Omit<CookieConsentPreferences, 'necessary'>;
