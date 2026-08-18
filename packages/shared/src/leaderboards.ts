import type { ProfileDecoration } from './decorations';

export const LeaderboardMetric = {
  PLAY_TIME: 'PLAY_TIME',
  KILLS: 'KILLS',
  KILL_DEATH_RATIO: 'KILL_DEATH_RATIO',
  COINS: 'COINS',
  HITS: 'HITS',
} as const;

export type LeaderboardMetric =
  (typeof LeaderboardMetric)[keyof typeof LeaderboardMetric];

export const leaderboardMetricLabels: Record<LeaderboardMetric, string> = {
  PLAY_TIME: 'Время в игре',
  KILLS: 'Убийства',
  KILL_DEATH_RATIO: 'K/D',
  COINS: 'Рубины',
  HITS: 'Попадания',
};

export interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    username: string;
    avatar: string | null;
    avatarDecoration: ProfileDecoration | null;
  };
  value: number;
  kills: number;
  deaths: number;
  playTime: number;
  lastServer: string | null;
}

export interface LeaderboardResponse {
  metric: LeaderboardMetric;
  updatedAt: string;
  items: LeaderboardEntry[];
}
