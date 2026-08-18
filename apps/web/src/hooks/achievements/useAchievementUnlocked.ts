'use client';

import type { AchievementUnlockedPayload } from '@twomc/shared';
import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';

export function useAchievementUnlocked() {
  const { isAuthenticated } = useAuth();
  const { socket } = useSocket(isAuthenticated);
  const [queue, setQueue] = useState<AchievementUnlockedPayload[]>([]);
  const [current, setCurrent] = useState<AchievementUnlockedPayload | null>(null);

  useEffect(() => {
    if (!socket) return;

    const onUnlocked = (payload: AchievementUnlockedPayload) => {
      setQueue((prev) => [...prev, payload]);
    };

    socket.on('achievement:unlocked', onUnlocked);
    return () => {
      socket.off('achievement:unlocked', onUnlocked);
    };
  }, [socket]);

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0] ?? null);
    }
  }, [current, queue]);

  const dismiss = () => {
    setCurrent(null);
    setQueue((prev) => prev.slice(1));
  };

  return { current, dismiss };
}
