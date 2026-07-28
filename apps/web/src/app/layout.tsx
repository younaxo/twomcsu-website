import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Geologica, Onest } from 'next/font/google';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { SiteSidebar } from '@/components/site-sidebar';
import { AnnouncementsBanner } from '@/components/system/AnnouncementsBanner';
import { MaintenanceGate } from '@/components/system/MaintenanceGate';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';

const ChatWidget = dynamic(
  () => import('@/components/chat/ChatWidget').then((mod) => mod.ChatWidget),
  { ssr: false },
);

const geologica = Geologica({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-geologica',
  // next/font has no override metrics for Geologica
  adjustFontFallback: false,
  fallback: ['system-ui', 'Arial', 'sans-serif'],
});

const onest = Onest({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-onest',
  adjustFontFallback: false,
  fallback: ['system-ui', 'Arial', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'twomc.su — Minecraft сервер',
  description: 'Игровой Minecraft сервер twomc.su',
  icons: {
    icon: [{ url: '/logo.png', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png' }],
  },
  openGraph: {
    title: 'twomc.su — Minecraft сервер',
    description: 'Игровой Minecraft сервер twomc.su',
    images: [{ url: '/og.png' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`dark ${onest.variable} ${geologica.variable}`}>
      <body className="flex min-h-screen antialiased">
        <QueryProvider>
          <AuthProvider>
            <TooltipProvider delayDuration={300}>
              <MaintenanceGate>
                <SiteSidebar />
                <div className="flex min-h-screen flex-1 flex-col lg:pl-[260px]">
                  <SiteHeader />
                  <AnnouncementsBanner />
                  <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-32">
                    {children}
                  </main>
                  <SiteFooter />
                </div>
                <ChatWidget />
                <Toaster theme="dark" position="top-center" richColors />
              </MaintenanceGate>
            </TooltipProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
