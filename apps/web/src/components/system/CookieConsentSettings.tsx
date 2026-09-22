'use client';

import type { CookieConsentInput } from '@twomc/shared';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useCookieConsent } from '@/hooks/useCookieConsent';

const toggleableKeys = ['analytics', 'marketing', 'preferences'] as const;

/** Lets a signed-in player review/change cookie categories from their account, per the Cookie Policy */
export function CookieConsentSettings() {
  const t = useTranslations('cookieConsent');
  const { consent, saveCustom, isSaving } = useCookieConsent();
  const [draft, setDraft] = useState<CookieConsentInput>({
    analytics: consent?.analytics ?? false,
    marketing: consent?.marketing ?? false,
    preferences: consent?.preferences ?? false,
  });

  useEffect(() => {
    if (consent) {
      setDraft({
        analytics: consent.analytics,
        marketing: consent.marketing,
        preferences: consent.preferences,
      });
    }
  }, [consent]);

  const update = (key: keyof CookieConsentInput, value: boolean) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    saveCustom(next);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('categories.necessary.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-4 py-3">
          <div>
            <p className="font-medium">{t('categories.necessary.title')}</p>
            <p className="text-sm text-muted-foreground">{t('categories.necessary.description')}</p>
          </div>
          <span className="shrink-0 text-xs font-medium text-muted-foreground">
            {t('alwaysOn')}
          </span>
        </div>
        {toggleableKeys.map((key) => (
          <div
            key={key}
            className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-4 py-3"
          >
            <div>
              <p className="font-medium">{t(`categories.${key}.title`)}</p>
              <p className="text-sm text-muted-foreground">{t(`categories.${key}.description`)}</p>
            </div>
            <Switch
              checked={draft[key]}
              disabled={isSaving}
              onCheckedChange={(checked) => update(key, checked)}
              aria-label={t(`categories.${key}.title`)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
