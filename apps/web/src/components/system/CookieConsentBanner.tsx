'use client';

import type { CookieConsentInput } from '@twomc/shared';
import { Cookie } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { cn } from '@/lib/utils';

const categoryKeys = ['necessary', 'analytics', 'marketing', 'preferences'] as const;

export function CookieConsentBanner() {
  const t = useTranslations('cookieConsent');
  const { showBanner, acceptAll, rejectAll, saveCustom, isSaving } = useCookieConsent();
  const [customizing, setCustomizing] = useState(false);
  const [draft, setDraft] = useState<CookieConsentInput>({
    analytics: false,
    marketing: false,
    preferences: false,
  });

  if (!showBanner) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-3 sm:px-5 sm:pb-5">
      <div
        role="region"
        aria-label={t('title')}
        className="glass-strong pointer-events-auto w-full max-w-xl rounded-2xl p-4 sm:p-5"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Cookie className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">{t('title')}</p>
            <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
              {t.rich('description', {
                cookiePolicy: (chunks) => (
                  <Link href="/documents" className="text-primary hover:underline">
                    {chunks}
                  </Link>
                ),
                privacyPolicy: (chunks) => (
                  <Link href="/documents" className="text-primary hover:underline">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </div>
        </div>

        {customizing ? (
          <div className="mt-4 space-y-2.5 border-t border-white/[0.07] pt-4">
            {categoryKeys.map((key) => (
              <div
                key={key}
                className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{t(`categories.${key}.title`)}</p>
                  <p className="text-xs text-muted-foreground">
                    {t(`categories.${key}.description`)}
                  </p>
                </div>
                {key === 'necessary' ? (
                  <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
                    {t('alwaysOn')}
                  </span>
                ) : (
                  <Switch
                    checked={draft[key]}
                    onCheckedChange={(checked) => setDraft((prev) => ({ ...prev, [key]: checked }))}
                    aria-label={t(`categories.${key}.title`)}
                  />
                )}
              </div>
            ))}
          </div>
        ) : null}

        <div
          className={cn(
            'mt-4 flex flex-wrap items-center gap-2',
            customizing ? 'justify-end' : 'justify-between',
          )}
        >
          {customizing ? (
            <>
              <Button variant="ghost" onClick={() => setCustomizing(false)} disabled={isSaving}>
                {t('back')}
              </Button>
              <Button onClick={() => saveCustom(draft)} disabled={isSaving}>
                {t('save')}
              </Button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setCustomizing(true)}
                className="text-sm font-medium text-muted-foreground underline-offset-2 hover:text-white hover:underline"
              >
                {t('customize')}
              </button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={rejectAll} disabled={isSaving}>
                  {t('reject')}
                </Button>
                <Button onClick={acceptAll} disabled={isSaving}>
                  {t('acceptAll')}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
