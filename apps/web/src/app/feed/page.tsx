'use client';

import Link from 'next/link';
import { Settings } from 'lucide-react';
import { ActivityFeed } from '@/components/activity/ActivityFeed';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';

export default function FeedPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">Лента активности</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Что происходит у игроков twomc.su
          </p>
        </div>
        {isAuthenticated ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="secondary" size="sm" className="gap-2">
                <Link href="/profile/settings#activity">
                  <Settings className="h-4 w-4" />
                  Настройки
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Настройки ленты</TooltipContent>
          </Tooltip>
        ) : null}
      </header>

      <ActivityFeed />
    </div>
  );
}
