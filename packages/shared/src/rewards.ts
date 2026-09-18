export const RewardRarity = {
  COMMON: 'COMMON',
  RARE: 'RARE',
  EPIC: 'EPIC',
  LEGENDARY: 'LEGENDARY',
} as const;
export type RewardRarity = (typeof RewardRarity)[keyof typeof RewardRarity];

export interface RewardCard {
  index: number;
  rarity: RewardRarity;
  revealed: boolean;
  reward: number | null;
}

export interface RewardsOverview {
  balance: number;
  streak: number;
  canClaim: boolean;
  nextClaimAt: string | null;
  cards: RewardCard[];
  wheel: {
    canSpin: boolean;
    nextSpinAt: string | null;
    prizes: Array<{ reward: number; rarity: RewardRarity }>;
  };
}

export const MiniGameType = {
  ROULETTE: 'ROULETTE',
  CRASH: 'CRASH',
  UPGRADER: 'UPGRADER',
} as const;
export type MiniGameType = (typeof MiniGameType)[keyof typeof MiniGameType];

export interface MiniGameResult {
  id: string;
  game: MiniGameType;
  betAmount: number;
  payoutAmount: number;
  multiplier: number;
  won: boolean;
  balance: number;
  result: Record<string, unknown>;
  serverSeed: string;
  serverSeedHash: string;
  createdAt: string;
}
