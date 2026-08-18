'use client';

import type { AchievementUnlockedPayload } from '@twomc/shared';
import { ACHIEVEMENT_RARITY_COLORS, ACHIEVEMENT_RARITY_LABELS } from '@twomc/shared';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { Share2, X } from 'lucide-react';
import { AchievementIcon } from './AchievementIcon';
import { Button } from '@/components/ui/button';

const ReactConfetti = dynamic(() => import('react-confetti'), { ssr: false });

const CONFETTI_RARITIES = new Set<string>(['LEGENDARY', 'MYTHIC']);
const AUTO_CLOSE_SECONDS = 10;

interface AchievementUnlockedDialogProps {
  payload: AchievementUnlockedPayload;
  onDismiss: () => void;
}

export function AchievementUnlockedDialog({ payload, onDismiss }: AchievementUnlockedDialogProps) {
  const { achievement, rewards } = payload;
  const color = ACHIEVEMENT_RARITY_COLORS[achievement.rarity];
  const showConfetti = CONFETTI_RARITIES.has(achievement.rarity);

  const [timeLeft, setTimeLeft] = useState(AUTO_CLOSE_SECONDS);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  useEffect(() => {
    const audio = new Audio('/sounds/achievement.mp3');
    void audio.play().catch(() => undefined);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [onDismiss]);

  const handleShare = async () => {
    const text = `Получил достижение «${achievement.name}» на twomc.su!`;
    try {
      if (navigator.share) {
        await navigator.share({ title: achievement.name, text });
      } else {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      // Ignore share/clipboard errors
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onDismiss}
        aria-hidden
      />

      {showConfetti && windowSize.width > 0 ? (
        <ReactConfetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={280}
          recycle={false}
          colors={[color, '#ffffff', '#FFD700', '#8B5CF6']}
          className="pointer-events-none"
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 1000 }}
        />
      ) : null}

      <div
        className="relative z-10 mx-4 w-full max-w-sm rounded-2xl glass-medium p-6 text-center shadow-2xl"
        style={{
          border: `2px solid ${color}`,
          boxShadow: `0 0 48px ${color}33`,
        }}
      >
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:text-white"
          aria-label="Закрыть"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Достижение разблокировано!
        </p>

        <div className="my-5 flex justify-center">
          <AchievementIcon iconUrl={achievement.iconUrl} rarity={achievement.rarity} size={80} />
        </div>

        <h2 className="mb-1.5 text-xl font-bold text-white">{achievement.name}</h2>
        <p className="mb-3 text-sm text-muted-foreground">{achievement.description}</p>

        <div
          className="mb-4 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold"
          style={{
            color,
            background: `${color}1a`,
            border: `1px solid ${color}55`,
          }}
        >
          {ACHIEVEMENT_RARITY_LABELS[achievement.rarity]}
        </div>

        {(rewards.rubies > 0 || rewards.title || rewards.badgeType) ? (
          <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Награды
            </p>
            <div className="space-y-1">
              {rewards.rubies > 0 ? (
                <p className="text-white">
                  <span className="font-semibold text-amber-400">+{rewards.rubies}</span> рубинов
                </p>
              ) : null}
              {rewards.title ? (
                <p className="text-white">
                  Титул:{' '}
                  <span className="font-medium" style={{ color }}>
                    {rewards.title}
                  </span>
                </p>
              ) : null}
              {rewards.badgeType ? (
                <p className="text-white">
                  Бейдж: <span className="font-medium">{rewards.badgeType}</span>
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={() => void handleShare()}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Поделиться
          </Button>
          <Button
            type="button"
            className="flex-1 font-semibold"
            style={{ background: color, color: '#000' }}
            onClick={onDismiss}
          >
            Понятно ({timeLeft}с)
          </Button>
        </div>
      </div>
    </div>
  );
}
