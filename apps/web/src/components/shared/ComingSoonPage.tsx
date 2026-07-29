'use client';

import { Hammer, Wrench } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ComingSoonPageProps {
  title?: string;
  description?: string;
  icon?: 'wrench' | 'hammer';
  className?: string;
}

/** Placeholder for modules that are not ready yet (tickets, wiki, reports, …). */
export function ComingSoonPage({
  title = 'Раздел в разработке',
  description = 'Скоро здесь появится центр поддержки',
  icon = 'wrench',
  className,
}: ComingSoonPageProps) {
  const Icon = icon === 'hammer' ? Hammer : Wrench;

  return (
    <div
      className={cn(
        'mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-6 px-4 text-center',
        className,
      )}
    >
      <div className="glass-medium flex h-20 w-20 items-center justify-center rounded-2xl">
        <Icon className="h-10 w-10 text-[#F57C00]" aria-hidden />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <Button asChild>
        <Link href="/">Вернуться на главную</Link>
      </Button>
    </div>
  );
}
