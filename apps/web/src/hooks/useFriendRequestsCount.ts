'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFriendsStore } from '@/stores/friendsStore';

const POLL_MS = 30_000;

/** Polls incoming friend requests every 30s while the user is signed in */
export function useFriendRequestsCount(): number {
  const { isAuthenticated, isLoading } = useAuth();
  const incomingCount = useFriendsStore((s) => s.incomingCount);
  const refresh = useFriendsStore((s) => s.refresh);
  const setIncomingCount = useFriendsStore((s) => s.setIncomingCount);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      setIncomingCount(0);
      return;
    }

    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, POLL_MS);

    return () => window.clearInterval(timer);
  }, [isAuthenticated, isLoading, refresh, setIncomingCount]);

  return incomingCount;
}
