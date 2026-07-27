import { create } from 'zustand';
import type { FriendRequestItem } from '@twomc/shared';
import { api } from '@/lib/api';

interface FriendsState {
  incomingCount: number;
  isLoading: boolean;
  setIncomingCount: (count: number) => void;
  refresh: () => Promise<void>;
}

export const useFriendsStore = create<FriendsState>((set, get) => ({
  incomingCount: 0,
  isLoading: false,

  setIncomingCount: (count) => set({ incomingCount: count }),

  refresh: async () => {
    if (get().isLoading) {
      return;
    }

    set({ isLoading: true });

    try {
      const { data } = await api.get<FriendRequestItem[]>('/friends/requests/incoming', {
        skipAuthRedirect: true,
      });
      set({ incomingCount: data.length });
    } catch {
      set({ incomingCount: 0 });
    } finally {
      set({ isLoading: false });
    }
  },
}));
