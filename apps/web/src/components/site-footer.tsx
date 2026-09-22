'use client';

import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/shared/Logo';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { cn } from '@/lib/utils';

const paymentMethods: Array<{ id: string; file: string; alt: string }> = [
  { id: 'visa', file: 'visa.svg', alt: 'Visa' },
  { id: 'mastercard', file: 'mastercard.svg', alt: 'Mastercard' },
  { id: 'mir', file: 'mir.svg', alt: 'МИР' },
  { id: 'sbp', file: 'sbp.svg', alt: 'СБП' },
];

export function SiteFooter() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const { data: status } = useSystemStatus();
  const online = !status?.maintenance.isEnabled;
  const year = new Date().getFullYear();

  const playerLinks = [
    { href: '/servers', label: t('startPlaying') },
    { href: '/store', label: tNav('store') },
    { href: '/servers', label: tNav('servers') },
    { href: '/rules', label: tNav('rules') },
    { href: '/news', label: tNav('news') },
    { href: '/support', label: tNav('support') },
  ] as const;

  // All five resolve to /documents (the real legal hub) until dedicated
  // routes exist — keeps every link working, none of them a dead page.
  const legalLinks = [
    t('privacyPolicy'),
    t('termsOfService'),
    t('cookiePolicy'),
    t('legalInfo'),
    t('refundPolicy'),
  ];

  return (
    <footer className="glass-strong mx-3 mb-3 mt-8 overflow-hidden rounded-[28px] text-sm text-muted-foreground sm:mx-5 lg:ml-6">
      <div className="grid gap-10 px-5 py-10 sm:px-8 md:grid-cols-2 lg:grid-cols-[1.25fr_0.8fr_0.8fr_0.95fr] lg:px-10">
        <div>
          <Logo size="md" />
          <p className="mt-5 max-w-sm leading-6">{t('about')}</p>
          <div className="mt-5 space-y-1 text-xs leading-5 text-muted-foreground/80">
            <p>Баранов Кирилл Алексеевич</p>
            <p>ИНН 230815487140</p>
          </div>
          <div className="mt-5 space-y-2">
            <a
              className="block transition-colors hover:text-foreground"
              href="mailto:help@twomc.su"
            >
              help@twomc.su
            </a>
            <a
              className="block transition-colors hover:text-foreground"
              href="mailto:admin@twomc.su"
            >
              admin@twomc.su
            </a>
            <p>
              <a className="transition-colors hover:text-foreground" href="mailto:gov@twomc.su">
                gov@twomc.su
              </a>{' '}
              <span className="text-xs text-muted-foreground/70">— {t('govEmailLabel')}</span>
            </p>
            <a
              className="flex items-center gap-1.5 transition-colors hover:text-foreground"
              href="https://t.me/twomcsu_adm"
              target="_blank"
              rel="noreferrer"
            >
              <Send className="h-3.5 w-3.5" aria-hidden />
              @twomcsu_adm
            </a>
          </div>
        </div>

        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
            {t('playersTitle')}
          </p>
          <ul className="space-y-2.5">
            {playerLinks.map((link, index) => (
              <li key={`${link.href}-${index}`}>
                <Link className="transition-colors hover:text-foreground" href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
            {t('legalTitle')}
          </p>
          <ul className="space-y-2.5">
            {legalLinks.map((label) => (
              <li key={label}>
                <Link className="transition-colors hover:text-foreground" href="/documents">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:items-end lg:text-right">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground/80 lg:text-right">
            {t('settingsTitle')}
          </p>
          <div className="flex flex-col gap-3 lg:items-end">
            <LanguageSwitcher variant="full" className="lg:w-auto" />
            <div className="inline-flex items-center gap-2 self-end rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs">
              <span
                className={cn('h-2 w-2 rounded-full', online ? 'bg-success' : 'bg-warning')}
                aria-hidden
              />
              {online ? t('statusOnline') : t('statusIssues')}
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/[0.07] px-5 py-5 text-xs text-muted-foreground/70 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
        <div className="space-y-0.5">
          <p>
            © twomc.su {year}. {t('rights')}
          </p>
          <p className="max-w-md">{t('disclaimer')}</p>
        </div>
        {paymentMethods.length > 0 ? (
          <div className="flex items-center gap-2" aria-label={t('paymentMethods')}>
            {paymentMethods.map((method) => (
              <Image
                key={method.id}
                src={`/payment/${method.file}`}
                alt={method.alt}
                width={40}
                height={26}
                unoptimized
                className="h-6 w-auto"
              />
            ))}
          </div>
        ) : null}
      </div>
    </footer>
  );
}
