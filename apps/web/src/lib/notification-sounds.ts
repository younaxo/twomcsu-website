import type { NotificationType } from '@twomc/shared';

const SOUND_MAP: Partial<Record<NotificationType, string>> & { default: string } = {
  default: '/sounds/notification.mp3',
  FRIEND_REQUEST: '/sounds/friend.mp3',
  FRIEND_ACCEPTED: '/sounds/friend.mp3',
  COMMENT_ON_PROFILE: '/sounds/comment.mp3',
  COMMENT_REPLY: '/sounds/comment.mp3',
  COMMENT_MENTION: '/sounds/comment.mp3',
  REPORT_ASSIGNED: '/sounds/report.mp3',
  REPORT_VERDICT: '/sounds/report.mp3',
  REPORT_TARGET: '/sounds/report.mp3',
  ACHIEVEMENT_UNLOCKED: '/sounds/achievement.mp3',
  AWARD_GRANTED: '/sounds/achievement.mp3',
  BADGE_GRANTED: '/sounds/achievement.mp3',
  ORDER_STATUS_CHANGED: '/sounds/success.mp3',
  PAYMENT_RECEIVED: '/sounds/success.mp3',
};

const STORAGE_KEY = 'twomc.notificationSounds';

export function areNotificationSoundsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value !== '0';
}

export function setNotificationSoundsEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
}

export function playNotificationSound(type?: NotificationType) {
  if (typeof window === 'undefined') return;
  if (!areNotificationSoundsEnabled()) return;

  const src = (type && SOUND_MAP[type]) || SOUND_MAP.default;
  try {
    const audio = new Audio(src);
    audio.volume = 0.45;
    void audio.play().catch(() => undefined);
  } catch {
    // ignore autoplay blocks
  }
}
