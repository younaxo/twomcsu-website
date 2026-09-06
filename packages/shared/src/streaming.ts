export const StreamPlatform = {
  TWITCH: 'TWITCH',
  YOUTUBE: 'YOUTUBE',
} as const;
export type StreamPlatform = (typeof StreamPlatform)[keyof typeof StreamPlatform];

export interface StreamChannel {
  id: string;
  platform: StreamPlatform;
  channelKey: string;
  channelUrl: string;
  displayName: string;
  avatarUrl: string | null;
  isPartner: boolean;
  isActive: boolean;
  isLive: boolean;
  title: string | null;
  thumbnailUrl: string | null;
  liveUrl: string | null;
  viewerCount: number;
  startedAt: string | null;
  lastCheckedAt: string | null;
  checkError?: string | null;
}
