'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { MessagesClient } from '@/components/messages/MessagesClient';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';

function MessagesPageContent() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return <Skeleton className="h-[calc(100dvh-7rem)] min-h-[520px] rounded-2xl" />;
  }

  return <MessagesClient />;
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[calc(100dvh-7rem)] min-h-[520px] rounded-2xl" />}>
      <MessagesPageContent />
    </Suspense>
  );
}
