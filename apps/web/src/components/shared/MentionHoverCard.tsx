'use client';

import type { UserProfile } from '@twomc/shared';
import { MessageCircle, UserPlus, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { SkinHead } from '@/components/shared/SkinHead';
import { Button } from '@/components/ui/button';
import {
  useFriendStatus,
  useFriendsCount,
  usePublicProfile,
  useSendFriendRequest,
} from '@/hooks/useFriendsQueries';
import { cn } from '@/lib/utils';

interface MentionHoverCardProps {
  username: string;
  children: React.ReactNode;
  className?: string;
}

export function MentionHoverCard({ username, children, className }: MentionHoverCardProps) {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: profile } = usePublicProfile(username, enabled);
  const { data: friendStatus } = useFriendStatus(username, enabled && open);
  const { data: friendsCount } = useFriendsCount(enabled && open ? username : undefined);
  const sendRequest = useSendFriendRequest();

  const clearTimers = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const handleEnter = () => {
    clearTimers();
    setEnabled(true);
    openTimer.current = setTimeout(() => setOpen(true), 300);
  };

  const handleLeave = () => {
    clearTimers();
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => () => clearTimers(), []);

  return (
    <span
      className={cn('relative inline', className)}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
      {open && profile ? (
        <span
          className="absolute left-0 top-full z-50 mt-2 w-[320px] max-w-[calc(100vw-2rem)] animate-in fade-in-0 zoom-in-95 rounded-2xl glass-strong p-4 shadow-xl"
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          <MentionCardBody
            profile={profile}
            friendsCount={friendsCount?.count}
            canAddFriend={friendStatus?.status === 'none'}
            isSending={sendRequest.isPending}
            onAddFriend={() => sendRequest.mutate(username)}
          />
        </span>
      ) : null}
    </span>
  );
}

function MentionCardBody({
  profile,
  friendsCount,
  canAddFriend,
  isSending,
  onAddFriend,
}: {
  profile: UserProfile;
  friendsCount?: number;
  canAddFriend: boolean;
  isSending: boolean;
  onAddFriend: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <SkinHead avatar={profile.avatar} username={profile.username} size={64} />
        <div className="min-w-0 flex-1 space-y-1">
          <ColoredUsername
            user={{ username: profile.username, position: profile.position }}
            badges={profile.badges}
            size="md"
            maxBadges={3}
          />
          <p className="text-xs text-muted-foreground">{profile.position.displayName}</p>
          {profile.customPosition ? (
            <p className="text-xs" style={{ color: profile.customPosition.color }}>
              {profile.customPosition.name}
            </p>
          ) : null}
          {profile.departments && profile.departments.length > 0 ? (
            <div className="flex flex-wrap gap-1 pt-1">
              {profile.departments.map((dept) => (
                <span
                  key={dept.id}
                  className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: dept.color ? `${dept.color}22` : undefined,
                    color: dept.color ?? undefined,
                  }}
                >
                  {dept.name}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {profile.statistics ? (
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <Stat label="Друзей" value={friendsCount ?? '—'} />
          <Stat label="Рубинов" value={profile.statistics.coins ?? '—'} />
          <Stat
            label="K/D"
            value={
              Number.isFinite(profile.statistics.killDeathRatio)
                ? profile.statistics.killDeathRatio.toFixed(2)
                : '—'
            }
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="secondary" className="gap-1.5">
          <Link href={`/users/${profile.username}`}>
            <UserRound className="h-3.5 w-3.5" />
            Профиль
          </Link>
        </Button>
        {canAddFriend ? (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={isSending}
            onClick={onAddFriend}
          >
            <UserPlus className="h-3.5 w-3.5" />
            В друзья
          </Button>
        ) : null}
        <Button size="sm" variant="ghost" className="gap-1.5" disabled title="Скоро">
          <MessageCircle className="h-3.5 w-3.5" />
          Написать
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-black/20 px-2 py-1.5">
      <div className="font-semibold text-foreground">{value}</div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  );
}
