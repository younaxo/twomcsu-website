'use client';

import { ReportType } from '@twomc/shared';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ReportForm } from '@/components/reports/ReportForm';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';

export default function ReportNewTechnicalPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return <Skeleton className="mx-auto mt-10 h-96 max-w-3xl rounded-2xl" />;
  }

  return (
    <div className="px-4 py-8">
      <ReportForm type={ReportType.TECHNICAL_ISSUE} />
    </div>
  );
}
