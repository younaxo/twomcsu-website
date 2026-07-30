'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ReportTypeCardGrid } from '@/components/reports/ReportTypeCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';

export default function ReportNewPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return <Skeleton className="mx-auto mt-10 h-96 max-w-6xl rounded-2xl" />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header className="rounded-2xl glass-strong p-6 md:p-8">
        <h1 className="text-2xl font-bold text-white md:text-3xl">Создать обращение</h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          Выберите тип обращения — мы направим его нужной команде модерации
        </p>
      </header>
      <ReportTypeCardGrid />
    </div>
  );
}
