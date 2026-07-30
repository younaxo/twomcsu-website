'use client';

import type { FriendsCountResponse, RestrictedProfileResponse, UserProfile } from '@twomc/shared';
import {
  Cake,
  Eye,
  Gem,
  Gift,
  Heart,
  MapPin,
  Package,
  Skull,
  Sword,
  TrendingUp,
  Tv,
  UserRound,
  Video,
  Wrench,
} from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AwardsList } from '@/components/shared/AwardsList';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { CopyableId } from '@/components/shared/CopyableId';
import { DefaultAvatar } from '@/components/shared/DefaultAvatar';
import { EmptyState } from '@/components/shared/EmptyState';
import { FriendButton } from '@/components/shared/FriendButton';
import { PositionBadge } from '@/components/shared/PositionBadge';
import { CommentsList } from '@/components/comments/CommentsList';
import { PriceDisplay } from '@/components/store/PriceDisplay';
import { ReactionButtons } from '@/components/profile/ReactionButtons';
import { ReportProfileDialog } from '@/components/profile/ReportProfileDialog';
import { RestrictedProfileView } from '@/components/profile/RestrictedProfileView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useGiftFromWishlist, useUserWishlist } from '@/hooks/store';
import { api, extractErrorMessage } from '@/lib/api';
import {
  formatNumber,
  genderLabels,
  mediaGroupLabels,
  resolveMediaUrl,
  socialPlatformLabels,
} from '@/lib/profile';
import { useStoreUiStore } from '@/stores/storeUiStore';

const SkinViewer3D = dynamic(
  () => import('@/components/shared/SkinViewer').then((mod) => mod.SkinViewer3D),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full min-h-[400px] w-full" />,
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

  const bannerUrl = resolveMediaUrl(profile.bannerUrl);
  const statsHidden = profile.statistics === null && !profile.isOwner;

  return (
    <div className="space-y-6">
      <div className="glass-medium overflow-hidden rounded-2xl">
        <div className="relative h-[200px] w-full bg-secondary sm:h-[320px]">
          {bannerUrl ? (
            <Image
              src={bannerUrl}
              alt=""
              fill
              priority
              quality={95}
              className="object-cover no-select"
              sizes="(max-width: 1440px) 100vw, 1440px"
              unoptimized
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-neutral-900 via-primary/15 to-neutral-900" />
          )}
        </div>

        <div className="relative px-4 pb-6 pt-4 sm:px-6 sm:pt-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="relative -mt-16 shrink-0 sm:-mt-20">
                <div className="relative h-32 w-32 no-select">
                  {resolveMediaUrl(profile.avatar) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveMediaUrl(profile.avatar)!}
                      alt={profile.username}
                      className="h-32 w-32 rounded-full object-cover ring-4 ring-[rgba(15,15,20,0.9)]"
                    />
                  ) : (
                    <div className="h-32 w-32 overflow-hidden rounded-full ring-4 ring-[rgba(15,15,20,0.9)]">
                      <DefaultAvatar username={profile.username} letterClassName="text-4xl" />
                    </div>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://mc-heads.net/head/${encodeURIComponent(profile.username)}/48`}
                    alt=""
                    className="absolute -bottom-1 -right-1 h-12 w-12 rounded-full"
                  />
                </div>
              </div>

              <div className="space-y-2 pb-1">
                <ColoredUsername
                  user={profile}
                  size="lg"
                  linkToProfile={false}
                  badges={profile.badges}
                />
                {profile.customPosition ? (
                  <p
                    className="text-sm italic"
                    style={{ color: profile.customPosition.color ?? undefined }}
                  >
                    {profile.customPosition.name}
                  </p>
                ) : null}
                {profile.statusText ? (
                  <p className="max-w-xl text-sm italic text-muted-foreground">{profile.statusText}</p>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <PositionBadge position={profile.position} size="md" />
                  {profile.mediaBadges.map((badge) => (
                    <Tooltip key={badge.mediaGroup}>
                      <TooltipTrigger asChild>
                        <a
                          href={badge.channelUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="cursor-pointer text-muted-foreground hover:text-foreground"
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
                <p className="text-sm text-muted-foreground">
                  {profile.isOnlineInGame && profile.currentServer ? (
                    <>
                      <span className="text-emerald-400">●</span> Играет на{' '}
                      <Link
                        href={`/servers/${profile.currentServer}`}
                        className="text-primary hover:underline"
                      >
                        {profile.currentServer}
                      </Link>
                    </>
                  ) : profile.lastServerActivity ? (
                    <>
                      Был в игре{' '}
                      {formatDistanceToNow(new Date(profile.lastServerActivity), {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </>
                  ) : (
                    'Не в игре'
                  )}
                </p>
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
              title="Рубинов"
              value={profile.statistics?.coins ?? 0}
              icon={Gem}
              tip="Баланс рубинов"
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
          <TabsTrigger value="wants">Вишлист</TabsTrigger>
          <TabsTrigger value="inventory">Инвентарь</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <div className="grid items-start gap-6 lg:grid-cols-[200px_1fr]">
            <div className="mx-auto h-[280px] w-[200px]">
              <SkinViewer3D
                username={profile.username}
                width={200}
                height={280}
                className="h-full w-full"
              />
            </div>

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
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-2 text-sm">
                    {profile.shortId != null ? (
                      <CopyableId
                        label="ID"
                        value={`#${profile.shortId}`}
                        display={`#${profile.shortId}`}
                      />
                    ) : null}
                    {profile.tag ? <CopyableId label="Тег" value={profile.tag} /> : null}
                  </div>
                  <dl className="grid gap-2 text-sm sm:grid-cols-[140px_1fr]">
                    <dt className="text-muted-foreground">Префикс</dt>
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

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Услуги</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wrench className="h-4 w-4" />
                  В разработке
                </CardContent>
              </Card>

              {(profile.country || profile.city || profile.gender || profile.age !== null) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <UserRound className="h-4 w-4 text-primary" />
                      Личное
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm">
                      {profile.country ? (
                        <li className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="text-muted-foreground">Страна:</span>
                          <span>{profile.country}</span>
                        </li>
                      ) : null}
                      {profile.city ? (
                        <li className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="text-muted-foreground">Город:</span>
                          <span>{profile.city}</span>
                        </li>
                      ) : null}
                      {profile.gender ? (
                        <li className="flex items-center gap-2">
                          <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="text-muted-foreground">Пол:</span>
                          <span>{genderLabels[profile.gender]}</span>
                        </li>
                      ) : null}
                      {profile.age !== null ? (
                        <li className="flex items-center gap-2">
                          <Cake className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="text-muted-foreground">Возраст:</span>
                          <span>{profile.age} лет</span>
                        </li>
                      ) : null}
                    </ul>
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

        <TabsContent value="wants" className="mt-4">
          <ProfileWishlistSection
            username={profile.username}
            isOwner={profile.isOwner}
            canGift={isAuthenticated && !profile.isOwner}
          />
        </TabsContent>

        <TabsContent value="inventory" className="mt-4">
          <EmptyState icon={Package} title="Инвентарь" description="В разработке" />
        </TabsContent>
      </Tabs>

      <section className="space-y-3 border-t border-border pt-6">
        <h2 className="text-lg font-semibold text-white">Комментарии</h2>
        <CommentsList
          profileUsername={profile.username}
          commentsEnabled={profile.commentsEnabled}
          commentsForcedReason={profile.commentsForcedReason}
        />
      </section>
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

function ProfileWishlistSection({
  username,
  isOwner,
  canGift,
}: {
  username: string;
  isOwner: boolean;
  canGift: boolean;
}) {
  const wishlist = useUserWishlist(username);
  const gift = useGiftFromWishlist();
  const openCartDrawer = useStoreUiStore((s) => s.openCartDrawer);

  if (wishlist.isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (wishlist.isError || !wishlist.data?.isPublic) {
    return (
      <EmptyState
        icon={Heart}
        title="Вишлист"
        description="Список скрыт или пуст"
        action={
          isOwner ? (
            <Button asChild variant="secondary" size="sm">
              <Link href="/profile/wishlist">Настроить вишлист</Link>
            </Button>
          ) : undefined
        }
      />
    );
  }

  const items = wishlist.data.items;

  if (items.length === 0) {
    return <EmptyState icon={Heart} title="Вишлист" description="Пока ничего нет" />;
  }

  const giftToOwner = async (productId: string) => {
    try {
      await gift.mutateAsync({ productId, giftToUsername: username });
      toast.success('Подарок добавлен в корзину');
      openCartDrawer();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось оформить подарок'));
    }
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => {
        const product = item.product;
        const variant = product.variants.find((v) => v.isActive) ?? product.variants[0];
        const img = resolveMediaUrl(product.image);
        return (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-card/50 p-3"
          >
            <Link
              href={`/store/product/${product.slug}`}
              className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-secondary"
            >
              {img ? (
                <Image src={img} alt="" fill className="object-cover" unoptimized />
              ) : null}
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/store/product/${product.slug}`}
                className="font-medium text-white hover:underline"
              >
                {product.name}
              </Link>
              {variant ? (
                <PriceDisplay price={variant.price} oldPrice={variant.oldPrice} size="sm" />
              ) : null}
            </div>
            {canGift && product.isGiftable && !product.isSelfOnly ? (
              <Button
                size="sm"
                variant="secondary"
                disabled={gift.isPending}
                onClick={() => void giftToOwner(product.id)}
              >
                <Gift className="mr-1 h-3.5 w-3.5" />
                Подарить
              </Button>
            ) : null}
          </div>
        );
      })}
    </div>
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
