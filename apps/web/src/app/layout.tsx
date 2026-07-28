import type { Metadata } from 'next';
import { Geologica, Onest } from 'next/font/google';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';

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
      <body className="flex min-h-screen flex-col antialiased">
        <QueryProvider>
          <AuthProvider>
            <TooltipProvider delayDuration={300}>
              <SiteHeader />
              <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
                {children}
              </main>
              <SiteFooter />
              <ChatWidget />
              <Toaster theme="dark" position="top-center" richColors />
            </TooltipProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
