import type { Metadata } from 'next';
import { Geologica, Onest } from 'next/font/google';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { SiteHeader } from '@/components/site-header';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';

const onest = Onest({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-onest',
});

const geologica = Geologica({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-geologica',
  // у next/font нет метрик Geologica, автоподбор фолбэка только сыпет ошибками в сборку
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: 'twomc.su — Minecraft сервер',
  description: 'Игровой Minecraft сервер twomc.su',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`dark ${onest.variable} ${geologica.variable}`}>
      <body className="min-h-screen antialiased">
        <AuthProvider>
          <TooltipProvider delayDuration={200}>
            <SiteHeader />
            <main className="mx-auto w-full max-w-5xl px-6 py-16">{children}</main>
            <Toaster theme="dark" position="top-center" richColors />
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
