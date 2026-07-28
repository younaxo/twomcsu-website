'use client';

import type { MyProfile, UserBadge } from '@twomc/shared';
import { getTopBadge } from '@twomc/shared';
import {
  Heart,
  LogOut,
  Package,
  Settings,
  User as UserIcon,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { DefaultAvatar } from '@/components/shared/DefaultAvatar';
import { PositionBadge } from '@/components/shared/PositionBadge';
import { UserBadgeIcon } from '@/components/shared/UserBadgeIcon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFriendRequestsCount } from '@/hooks/useFriendRequestsCount';
import { useFriendsCount, useMyProfile } from '@/hooks/useFriendsQueries';
import { resolveMediaUrl } from '@/lib/profile';
import { cn } from '@/lib/utils';

export { getTopBadge };

interface ProfileMiniPreviewProps {
  username: string;
  avatar: string | null;
  onLogout: () => void;
}

function PreviewBody({
  profile,
  onLogout,
}: {
  profile: MyProfile;
  onLogout: () => void;
}) {
  const friendsCount = useFriendsCount(profile.username);
  const topBadge = getTopBadge(profile.badges);
  const bannerUrl = resolveMediaUrl(profile.bannerUrl);
  const avatarUrl = resolveMediaUrl(profile.avatar);
  const skinHead = `https://mc-heads.net/head/${encodeURIComponent(profile.username)}/48`;
  const incoming = useFriendRequestsCount();

  return (
    <div className="overflow-hidden">
      <div className="relative h-24 w-full bg-gradient-to-br from-primary/30 via-secondary to-card">
        {bannerUrl ? (
          <Image src={bannerUrl} alt="" fill className="object-cover" sizes="320px" unoptimized />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(15,15,20,0.95)] to-transparent" />
      </div>

      <div className="relative -mt-10 px-4 pb-3">
        <div className="relative mb-3 h-20 w-20">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatarUrl} alt={profile.username} />
            <AvatarFallback className="p-0">
              <DefaultAvatar username={profile.username} letterClassName="text-xl" />
            </AvatarFallback>
          </Avatar>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={skinHead}
            alt=""
            className="absolute -bottom-1 -right-1 h-10 w-10 rounded-full"
          />
        </div>

        <div className="mb-1 flex flex-wrap items-center gap-2">
          <ColoredUsername
            user={profile}
            badges={topBadge ? [topBadge] : []}
            size="md"
            linkToProfile={false}
          />
        </div>
        <div className="mb-3">
          <PositionBadge position={profile.position} size="sm" />
        </div>

        <div className="mb-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-white/5 px-2 py-1.5">
            <p className="text-sm font-semibold text-white">{friendsCount.data?.count ?? '—'}</p>
            <p className="text-[10px] text-muted-foreground">Друзей</p>
          </div>
          <div className="rounded-lg bg-white/5 px-2 py-1.5">
            <p className="text-sm font-semibold text-white">
              {profile.statistics?.playTime != null
                ? Math.floor(profile.statistics.playTime / 60)
                : '—'}
            </p>
            <p className="text-[10px] text-muted-foreground">Часов</p>
          </div>
          <div className="rounded-lg bg-white/5 px-2 py-1.5">
            <p className="text-sm font-semibold text-white">
              {profile.statistics?.coins ?? '—'}
            </p>
            <p className="text-[10px] text-muted-foreground">Монет</p>
          </div>
        </div>

        <div className="space-y-0.5">
          <DropdownMenuItem asChild>
            <Link href={`/users/${profile.username}`} className="cursor-pointer gap-2">
              <UserIcon className="h-4 w-4" />
              Мой профиль
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile/settings" className="cursor-pointer gap-2">
              <Settings className="h-4 w-4" />
              Настройки
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile/friends" className="cursor-pointer gap-2">
              <Users className="h-4 w-4" />
              Друзья
              {incoming > 0 ? (
                <span className="ml-auto rounded-full bg-destructive px-1.5 text-[10px] text-white">
                  {incoming}
                </span>
              ) : null}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile/wishlist" className="cursor-pointer gap-2">
              <Heart className="h-4 w-4" />
              Вишлист
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile/orders" className="cursor-pointer gap-2">
              <Package className="h-4 w-4" />
              Заказы
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem onSelect={onLogout} className="cursor-pointer gap-2 text-destructive">
            <LogOut className="h-4 w-4" />
            Выйти
          </DropdownMenuItem>
        </div>
      </div>
    </div>
  );
}

export function ProfileMiniPreview({ username, avatar, onLogout }: ProfileMiniPreviewProps) {
  const profile = useMyProfile(true);
  const skinUrl = `https://minotar.net/helm/${encodeURIComponent(username)}/64.png`;
  const avatarUrl = resolveMediaUrl(avatar) ?? skinUrl;
  const topBadge = getTopBadge(profile.data?.badges);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt={username} />
            <AvatarFallback className="p-0">
              <DefaultAvatar username={username} letterClassName="text-xs" />
            </AvatarFallback>
          </Avatar>
          {topBadge ? <UserBadgeIcon type={topBadge.type} size={16} /> : null}
          <span className="hidden max-w-28 truncate text-sm font-medium md:inline">{username}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(
          'w-80 overflow-hidden border-white/10 p-0',
          'bg-[rgba(15,15,20,0.85)] backdrop-blur-[24px]',
        )}
      >
        {profile.data ? (
          <PreviewBody profile={profile.data} onLogout={onLogout} />
        ) : (
          <div className="space-y-3 p-4">
            <div className="h-24 animate-pulse rounded-lg bg-white/10" />
            <div className="h-8 w-32 animate-pulse rounded bg-white/10" />
            <div className="h-20 animate-pulse rounded bg-white/10" />
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
