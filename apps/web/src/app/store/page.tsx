import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import StorePageClient from './store-client';

export default function StorePage() {
  return (
    <Suspense fallback={<Skeleton className="h-[32rem] w-full" />}>
      <StorePageClient />
    </Suspense>
  );
}
