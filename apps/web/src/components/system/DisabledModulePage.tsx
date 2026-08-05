'use client';

import { Ban } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface DisabledModulePageProps {
  reason?: string | null;
  backHref?: string;
}

export function DisabledModulePage({
  reason,
  backHref = '/',
}: DisabledModulePageProps) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="glass-medium flex h-16 w-16 items-center justify-center rounded-2xl">
        <Ban className="h-8 w-8 text-amber-500" aria-hidden />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Раздел временно недоступен</h1>
        <p className="text-muted-foreground">
          {reason?.trim() || 'Модуль отключён администрацией. Загляните позже.'}
        </p>
      </div>
      <Button asChild variant="secondary">
        <Link href={backHref}>Вернуться</Link>
      </Button>
    </div>
  );
}
