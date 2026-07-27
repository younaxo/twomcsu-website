'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function CurrencyRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/store?tab=currency');
  }, [router]);

  return <Skeleton className="h-64 w-full" />;
}
