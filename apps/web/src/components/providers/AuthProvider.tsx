'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

/** Access token lives in memory, so every page load restores the session from the refresh cookie */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const fetchMe = useAuthStore((state) => state.fetchMe);

  useEffect(() => {
    void fetchMe();
  }, [fetchMe]);

  return <>{children}</>;
}
