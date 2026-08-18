import type {
  MediaPartnerDashboard,
  ReferralDashboard,
  ReferralLeaderboardEntry,
} from '@twomc/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const useReferralDashboard = () =>
  useQuery({
    queryKey: ['referrals', 'me'],
    queryFn: async () => (await api.get<ReferralDashboard>('/referrals/me')).data,
  });
export const useReferralLeaderboard = () =>
  useQuery({
    queryKey: ['referrals', 'leaderboard'],
    queryFn: async () => (await api.get<ReferralLeaderboardEntry[]>('/referrals/leaderboard')).data,
  });
export const useMediaDashboard = () =>
  useQuery({
    queryKey: ['media', 'me'],
    queryFn: async () => (await api.get<MediaPartnerDashboard>('/media/me')).data,
  });
