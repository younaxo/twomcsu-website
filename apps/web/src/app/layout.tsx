import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
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

const AchievementUnlockedListener = dynamic(
  () =>
    import('@/components/achievements/AchievementUnlockedListener').then(
      (mod) => mod.AchievementUnlockedListener,
    ),
  { ssr: false },
);

export const metadata: Metadata = {
  metadataBase: new URL('https://twomc.su'),
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
    <html lang="ru" className="dark">
      <body className="min-h-screen antialiased">
        <QueryProvider>
          <AuthProvider>
            <TooltipProvider delayDuration={300}>
              <MaintenanceGate>
                <SiteSidebar />
                <div className="flex min-h-screen flex-col transition-[padding-left] duration-300 ease-out lg:pl-[var(--sidebar-rail-width)]">
                  <SiteHeader />
                  <AnnouncementsBanner />
                  <main className="mx-auto w-full max-w-[1580px] flex-1 px-4 pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-28 lg:px-8 xl:px-10">
                    {children}
                  </main>
                  <SiteFooter />
                </div>
                <ChatWidget />
                <AchievementUnlockedListener />
                <Toaster
                  theme="dark"
                  position="bottom-center"
                  visibleToasts={3}
                  duration={4200}
                  gap={12}
                  toastOptions={{
                    classNames: {
                      toast:
                        'group toast rounded-xl border border-white/[0.12] bg-[rgba(17,16,14,0.96)] text-white shadow-[0_18px_48px_rgba(0,0,0,0.42)] backdrop-blur-2xl',
                      title: 'text-sm font-semibold',
                      description: 'text-[13px] font-medium text-neutral-300',
                    },
                  }}
                />
              </MaintenanceGate>
            </TooltipProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
