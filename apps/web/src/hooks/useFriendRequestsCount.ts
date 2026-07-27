'use client';

import { useIncomingRequestsCount } from '@/hooks/useFriendsQueries';
import { useAuth } from '@/hooks/useAuth';

/** Polls incoming friend request count while signed in */
export function useFriendRequestsCount(): number {
  const { isAuthenticated, isLoading } = useAuth();
  const { data = 0 } = useIncomingRequestsCount(isAuthenticated && !isLoading);

  return data;
}
