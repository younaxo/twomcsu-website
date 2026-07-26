import type { Metadata } from 'next';
import { Geologica, Onest } from 'next/font/google';
import { SiteHeader } from '@/components/site-header';
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
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl px-6 py-16">{children}</main>
      </body>
    </html>
  );
}
