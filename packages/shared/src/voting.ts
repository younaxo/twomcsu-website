export interface VoteSite {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  url: string;
  logoUrl: string | null;
  rewardCoins: number;
  cooldownHours: number;
  sortOrder: number;
  isActive: boolean;
  votesCount?: number;
  lastVotedAt?: string | null;
  nextVoteAt?: string | null;
  canVote?: boolean;
}

export interface VotingOverview {
  sites: VoteSite[];
  totalVotes: number;
  totalEarned: number;
}
