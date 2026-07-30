'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DonationProblemForm } from '@/components/reports/DonationProblemForm';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';

export default function SupportPage() {
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
      <DonationProblemForm />
    </div>
  );
}
