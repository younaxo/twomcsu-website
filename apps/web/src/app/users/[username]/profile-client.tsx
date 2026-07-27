'use client';

import type { FriendsCountResponse, RestrictedProfileResponse, UserProfile } from '@twomc/shared';
import {
  Coins,
  Eye,
  Package,
  ShoppingBag,
  Skull,
  Sword,
  TrendingUp,
  Tv,
  Video,
} from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { AwardsList } from '@/components/shared/AwardsList';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { FriendButton } from '@/components/shared/FriendButton';
import { PositionBadge } from '@/components/shared/PositionBadge';
import { SkinHead } from '@/components/shared/SkinHead';
import { CommentsList } from '@/components/comments/CommentsList';
import { ReactionButtons } from '@/components/profile/ReactionButtons';
import { ReportProfileDialog } from '@/components/profile/ReportProfileDialog';
import { RestrictedProfileView } from '@/components/profile/RestrictedProfileView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import {
  formatNumber,
  genderLabels,
  mediaGroupLabels,
  resolveMediaUrl,
  socialPlatformLabels,
} from '@/lib/profile';

const SkinViewer3D = dynamic(
  () => import('@/components/shared/SkinViewer').then((mod) => mod.SkinViewer3D),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-[280px]" />,
  },
);

interface ProfileClientProps {
  username: string;
  initial: UserProfile;
}

function parseRestricted(error: unknown): RestrictedProfileResponse | null {
  if (!axios.isAxiosError(error) || error.response?.status !== 403) {
    return null;
  }

  const body = error.response.data as RestrictedProfileResponse & {
    message?: RestrictedProfileResponse;
  };

  if (body.restricted === true) {
    return body;
  }

  if (typeof body.message === 'object' && body.message?.restricted) {
    return body.message;
  }

  return null;
}

export function ProfileClient({ username, initial }: ProfileClientProps) {
  const { isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(initial);
  const [restricted, setRestricted] = useState<RestrictedProfileResponse | null>(null);
  const [friendsCount, setFriendsCount] = useState<number | null>(null);

  useEffect(() => {
    void api
      .get<UserProfile>(`/users/${encodeURIComponent(username)}/public`, {
        skipAuthRedirect: true,
      })
      .then(({ data }) => {
        // TODO: после Friends System — если не друг, показывать friends-only view
        setRestricted(null);
        setProfile(data);
      })
      .catch((error) => {
        const privateProfile = parseRestricted(error);
        if (privateProfile) {
          setRestricted(privateProfile);
          setProfile(null);
        }
      });
  }, [username, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !profile || profile.isOwner) {
      return;
    }

    void api
      .post(`/users/${encodeURIComponent(username)}/view`, undefined, { skipAuthRedirect: true })
      .catch(() => undefined);
  }, [username, isAuthenticated, profile]);

  useEffect(() => {
    if (restricted) {
      setFriendsCount(null);
      return;
    }

    void api
      .get<FriendsCountResponse>(`/friends/count/${encodeURIComponent(username)}`, {
        skipAuthRedirect: true,
      })
      .then(({ data }) => setFriendsCount(data.count))
      .catch(() => setFriendsCount(null));
  }, [username, restricted]);

  if (restricted) {
    return <RestrictedProfileView data={restricted} />;
  }

  if (!profile) {
    return <Skeleton className="h-[32rem] w-full" />;
  }

  // TODO: после Friends System — если не друг, показывать friends-only view
  const bannerUrl = resolveMediaUrl(profile.bannerUrl);
  const statsHidden = profile.statistics === null && !profile.isOwner;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="relative h-40 w-full bg-secondary sm:h-52">
          {bannerUrl ? (
            <Image src={bannerUrl} alt="" fill className="object-cover" unoptimized />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-secondary via-accent to-secondary" />
          )}
        </div>

        <div className="relative px-4 pb-6 sm:px-6">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <SkinHead
                username={profile.username}
                minecraftNick={profile.minecraftNick}
                avatar={resolveMediaUrl(profile.avatar) ?? null}
                size={112}
                className="border-4 border-card shadow-lg"
              />
              <div className="space-y-2 pb-1">
                <ColoredUsername
                  user={profile}
                  size="lg"
                  linkToProfile={false}
                  badges={profile.badges}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <PositionBadge position={profile.position} size="md" />
                  {profile.mediaBadges.map((badge) => (
                    <Tooltip key={badge.mediaGroup}>
                      <TooltipTrigger asChild>
                        <a
                          href={badge.channelUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {badge.mediaGroup === 'YOUTUBE' ? (
                            <Video className="h-4 w-4" />
                          ) : badge.mediaGroup === 'TWITCH' ? (
                            <Tv className="h-4 w-4" />
                          ) : (
                            <span className="text-xs font-medium">
                              {mediaGroupLabels[badge.mediaGroup]}
                            </span>
                          )}
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>{mediaGroupLabels[badge.mediaGroup]}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                {profile.statusText ? (
                  <p className="text-sm text-muted-foreground">{profile.statusText}</p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 sm:items-end">
              <AwardsList awards={profile.awards} size={28} />
              {isAuthenticated && !profile.isOwner ? (
                <div className="flex flex-wrap items-center gap-2">
                  <FriendButton username={profile.username} />
                  <ReportProfileDialog username={profile.username} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statsHidden ? (
          <Card className="sm:col-span-2 lg:col-span-4">
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              Статистика скрыта
            </CardContent>
          </Card>
        ) : (
          <>
            <StatCard
              title="Коинов"
              value={profile.statistics?.coins ?? 0}
              icon={Coins}
              tip="Баланс коинов на сервере"
            />
            <StatCard
              title="Убийств"
              value={profile.statistics?.kills ?? 0}
              icon={Sword}
              tip="Количество убийств"
            />
            <StatCard
              title="Смертей"
              value={profile.statistics?.deaths ?? 0}
              icon={Skull}
              tip="Количество смертей"
            />
            <StatCard
              title="У/С"
              value={profile.statistics?.killDeathRatio ?? 0}
              icon={TrendingUp}
              tip="Соотношение убийств к смертям"
              ratio
            />
          </>
        )}
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Информация</TabsTrigger>
          <TabsTrigger value="comments">Комментарии</TabsTrigger>
          <TabsTrigger value="inventory">Инвентарь</TabsTrigger>
          <TabsTrigger value="services">Услуги</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <SkinViewer3D minecraftNick={profile.minecraftNick} className="mx-auto" />

            <div className="space-y-4">
              {profile.bio ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">О себе</CardTitle>
                  </CardHeader>
                  <CardContent className="whitespace-pre-wrap text-sm">{profile.bio}</CardContent>
                </Card>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Информация</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-2 text-sm sm:grid-cols-[140px_1fr]">
                    <dt className="text-muted-foreground">ID</dt>
                    <dd>{profile.id.slice(0, 8)}</dd>
                    <dt className="text-muted-foreground">Роль</dt>
                    <dd style={{ color: profile.position.color }}>{profile.position.displayName}</dd>
                    <dt className="text-muted-foreground">Регистрация</dt>
                    <dd>{format(new Date(profile.createdAt), 'dd.MM.yyyy', { locale: ru })}</dd>
                    <dt className="text-muted-foreground">Последний вход</dt>
                    <dd>
                      {profile.lastLoginAt
                        ? format(new Date(profile.lastLoginAt), 'dd.MM.yyyy HH:mm', { locale: ru })
                        : '—'}
                    </dd>
                    <dt className="text-muted-foreground">Последний сервер</dt>
                    <dd>{profile.statistics?.lastServer ?? '—'}</dd>
                    <dt className="text-muted-foreground">Клан</dt>
                    <dd className="text-muted-foreground">В разработке</dd>
                    <dt className="text-muted-foreground">Друзей</dt>
                    <dd>{friendsCount === null ? '—' : formatNumber(friendsCount)}</dd>
                  </dl>
                </CardContent>
              </Card>

              {(profile.country || profile.city || profile.gender || profile.age !== null) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Личное</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid gap-2 text-sm sm:grid-cols-[140px_1fr]">
                      {profile.country ? (
                        <>
                          <dt className="text-muted-foreground">Страна</dt>
                          <dd>{profile.country}</dd>
                        </>
                      ) : null}
                      {profile.city ? (
                        <>
                          <dt className="text-muted-foreground">Город</dt>
                          <dd>{profile.city}</dd>
                        </>
                      ) : null}
                      {profile.gender ? (
                        <>
                          <dt className="text-muted-foreground">Пол</dt>
                          <dd>{genderLabels[profile.gender]}</dd>
                        </>
                      ) : null}
                      {profile.age !== null ? (
                        <>
                          <dt className="text-muted-foreground">Возраст</dt>
                          <dd>{profile.age} лет</dd>
                        </>
                      ) : null}
                    </dl>
                  </CardContent>
                </Card>
              )}

              {profile.socials && profile.socials.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Соц сети</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-3">
                    {profile.socials.map((link) => (
                      <Tooltip key={link.platform}>
                        <TooltipTrigger asChild>
                          <a
                            href={socialHref(link.platform, link.value)}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
                          >
                            {socialPlatformLabels[link.platform]}
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>{socialPlatformLabels[link.platform]}</TooltipContent>
                      </Tooltip>
                    ))}
                  </CardContent>
                </Card>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Награды</CardTitle>
                </CardHeader>
                <CardContent>
                  <AwardsList awards={profile.awards} />
                </CardContent>
              </Card>

              <div className="flex flex-wrap items-center gap-4">
                <ReactionButtons
                  username={profile.username}
                  likesCount={profile.likesCount}
                  dislikesCount={profile.dislikesCount}
                  userReaction={profile.userReaction}
                  disabled={!isAuthenticated || profile.isOwner}
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      {formatNumber(profile.viewsCount)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Просмотры профиля</TooltipContent>
                </Tooltip>
                {isAuthenticated && !profile.isOwner ? (
                  <ReportProfileDialog username={profile.username} />
                ) : null}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="comments" className="mt-4">
          <CommentsList
            profileUsername={profile.username}
            commentsEnabled={profile.commentsEnabled}
            commentsForcedReason={profile.commentsForcedReason}
          />
        </TabsContent>

        <TabsContent value="inventory">
          <Placeholder icon={Package} title="Инвентарь" />
        </TabsContent>

        <TabsContent value="services">
          <Placeholder icon={ShoppingBag} title="Услуги" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  tip,
  ratio,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tip: string;
  ratio?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Card>
          <CardContent className="space-y-2 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" />
              <p className="text-xl font-semibold">
                {ratio ? value.toFixed(2) : formatNumber(value)}
              </p>
            </div>
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  );
}

function Placeholder({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <Icon className="h-10 w-10" />
        <p className="text-lg font-medium">{title}</p>
        <p className="text-sm">В разработке</p>
      </CardContent>
    </Card>
  );
}

function socialHref(platform: string, value: string): string {
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  switch (platform) {
    case 'TELEGRAM':
      return `https://t.me/${value.replace(/^@/, '')}`;
    case 'DISCORD':
      return `https://discord.com/users/${value}`;
    case 'VK':
      return `https://vk.com/${value}`;
    case 'YOUTUBE':
      return `https://youtube.com/@${value.replace(/^@/, '')}`;
    case 'TWITCH':
      return `https://twitch.tv/${value}`;
    case 'TIKTOK':
      return `https://tiktok.com/@${value.replace(/^@/, '')}`;
    case 'STEAM':
      return `https://steamcommunity.com/id/${value}`;
    default:
      return value;
  }
}

export function ProfileLoading() {
  return <Skeleton className="h-[40rem] w-full" />;
}
