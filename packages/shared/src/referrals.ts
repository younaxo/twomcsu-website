import type { MediaGroup } from './profile';

export interface ReferralDashboard {
  code: string;
  referralUrl: string;
  registrationUrl: string;
  directCount: number;
  networkCount: number;
  earned: number;
  levels: Array<{ level: number; count: number; rewardPerInvite: number }>;
  recent: Array<{ username: string; level: number; reward: number; createdAt: string }>;
}

export interface ReferralLeaderboardEntry {
  rank: number;
  username: string;
  avatar: string | null;
  directCount: number;
  networkCount: number;
  earned: number;
}

export interface MediaPartnerDashboard {
  channels: Array<{
    id: string;
    mediaGroup: MediaGroup;
    channelUrl: string;
    rank: number;
    promoCode: string | null;
    registrations: number;
    registrations30d: number;
    referralUrl: string | null;
    registrationUrl: string | null;
  }>;
  requests: Array<{
    id: string;
    mediaGroup: MediaGroup;
    channelUrl: string;
    description: string | null;
    status: string;
    reviewNote: string | null;
    createdAt: string;
  }>;
}
