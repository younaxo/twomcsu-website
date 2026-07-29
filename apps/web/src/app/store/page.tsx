'use client';

import { DisabledModulePage } from '@/components/system/DisabledModulePage';
import { useIsModuleDisabled } from '@/hooks/useSystemStatus';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import StorePageClient from './store-client';

export default function StorePage() {
  const { disabled, reason } = useIsModuleDisabled('store');

  if (disabled) {
    return <DisabledModulePage reason={reason} />;
  }

  return (
    <Suspense fallback={<Skeleton className="h-[32rem] w-full" />}>
      <StorePageClient />
    </Suspense>
  );
}
