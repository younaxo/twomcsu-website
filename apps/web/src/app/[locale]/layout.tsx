import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { AppToaster } from '@/components/providers/AppToaster';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { SiteSidebar } from '@/components/site-sidebar';
import { CookieConsentBanner } from '@/components/system/CookieConsentBanner';
import { AnnouncementsBanner } from '@/components/system/AnnouncementsBanner';
import { MaintenanceGate } from '@/components/system/MaintenanceGate';
import { TooltipProvider } from '@/components/ui/tooltip';
import { routing } from '@/i18n/routing';
import '../globals.css';

const ChatWidget = dynamic(
  () => import('@/components/chat/ChatWidget').then((mod) => mod.ChatWidget),
  { ssr: false },
);

const AchievementUnlockedListener = dynamic(
  () =>
    import('@/components/achievements/AchievementUnlockedListener').then(
      (mod) => mod.AchievementUnlockedListener,
    ),
  { ssr: false },
);

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: 'meta' });

  const languages = Object.fromEntries(
    routing.locales.map((code) => [code, code === routing.defaultLocale ? '/' : `/${code}`]),
  );

  return {
    metadataBase: new URL('https://twomc.su'),
    title: t('title'),
    description: t('description'),
    alternates: { languages },
    icons: {
      icon: [{ url: '/logo.png', type: 'image/png' }],
      apple: [{ url: '/apple-touch-icon.png' }],
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      images: [{ url: '/og.png' }],
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <NextIntlClientProvider locale={locale}>
          <ThemeProvider>
            <QueryProvider>
              <AuthProvider>
                <TooltipProvider delayDuration={300}>
                  <MaintenanceGate>
                    <SiteSidebar />
                    <div className="flex min-h-screen flex-col transition-[padding-left] duration-300 ease-out lg:pl-[var(--sidebar-rail-width)]">
                      <SiteHeader />
                      <AnnouncementsBanner />
                      <main className="mx-auto w-full max-w-[1480px] flex-1 px-4 pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-28 lg:px-8 xl:px-10">
                        {children}
                      </main>
                      <SiteFooter />
                    </div>
                    <ChatWidget />
                    <AchievementUnlockedListener />
                    <CookieConsentBanner />
                    <AppToaster />
                  </MaintenanceGate>
                </TooltipProvider>
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
