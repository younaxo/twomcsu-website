'use client';

import type { FriendsCountResponse, RestrictedProfileResponse, UserProfile } from '@twomc/shared';
import { RoleGroup, hasRoleGroup } from '@twomc/shared';
import {
  Cake,
  ExternalLink,
  Eye,
  Gift,
  Heart,
  MapPin,
  MessageCircle,
  Package,
  Shield,
  Tv,
  UserRound,
  Video,
  Wrench,
} from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Link } from '@/i18n/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AvatarWithSkin } from '@/components/shared/AvatarWithSkin';
import { AwardsList } from '@/components/shared/AwardsList';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { CopyableId } from '@/components/shared/CopyableId';
import { EmptyState } from '@/components/shared/EmptyState';
import { FriendButton } from '@/components/shared/FriendButton';
import { DepartmentBadgesList } from '@/components/shared/DepartmentBadgesList';
import { AchievementShowcase } from '@/components/achievements/AchievementShowcase';
import { ActivityCard } from '@/components/activity/ActivityCard';
import { CommentsList } from '@/components/comments/CommentsList';
import { PriceDisplay } from '@/components/store/PriceDisplay';
import { ReactionButtons } from '@/components/profile/ReactionButtons';
import { ProfileStatus } from '@/components/profile/ProfileStatus';
import { ReportProfileDialog } from '@/components/profile/ReportProfileDialog';
import { RestrictedProfileView } from '@/components/profile/RestrictedProfileView';
import { UserContextMenu } from '@/components/moderation/UserContextMenu';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useUserActivity } from '@/hooks/activity';
import { useGiftFromWishlist, useUserWishlist } from '@/hooks/store';
import { useUserAchievements } from '@/hooks/achievements';
import { useCreateDirectConversation } from '@/hooks/useDirectMessages';
import { api, extractErrorMessage } from '@/lib/api';
import {
  formatNumber,
  genderLabels,
  mediaGroupLabels,
  resolveMediaUrl,
  socialPlatformLabels,
} from '@/lib/profile';
import { useStoreUiStore } from '@/stores/storeUiStore';
import { cn } from '@/lib/utils';

const SkinViewer3D = dynamic(
  () => import('@/components/shared/SkinViewer').then((mod) => mod.SkinViewer3D),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full min-h-[400px] w-full" />,
  },
);

interface ProfileClientProps {
  username: string;
  initial: UserProfile | null;
  initialRestricted?: RestrictedProfileResponse | null;
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

export function ProfileClient({ username, initial, initialRestricted = null }: ProfileClientProps) {
  const { user: me, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(initial);
  const [restricted, setRestricted] = useState<RestrictedProfileResponse | null>(initialRestricted);
  const [friendsCount, setFriendsCount] = useState<number | null>(null);
  const userAchievements = useUserAchievements(username);
  const createConversation = useCreateDirectConversation();

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
  const allSocials = profile.socials ?? [];
  const socialLinks = allSocials.filter(
    (link) => link.platform === 'DISCORD' || link.platform === 'STEAM',
  );
  const otherSocials = allSocials.filter(
    (link) => link.platform !== 'DISCORD' && link.platform !== 'STEAM',
  );
  const ownerPrivacyNote =
    profile.isOwner && profile.profileVisibility === 'NOBODY'
      ? 'Ваш профиль (виден только вам)'
      : profile.isOwner && profile.profileVisibility === 'FRIENDS_ONLY'
        ? 'Ваш профиль (виден только друзьям)'
        : null;

  return (
    <div className="space-y-6">
      {ownerPrivacyNote ? (
        <div className="border border-border bg-card rounded-xl border border-orange-500/30 px-4 py-3 text-sm text-orange-200">
          {ownerPrivacyNote}
        </div>
      ) : null}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="relative h-[180px] w-full bg-secondary sm:h-[260px]">
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
            <div className="h-full w-full bg-gradient-to-r from-secondary via-primary/15 to-secondary" />
          )}

          <div className="absolute right-3 top-3 flex items-center gap-2 sm:right-4 sm:top-4">
            <div className="rounded-full border border-border bg-card/90 backdrop-blur">
              <ReactionButtons
                username={profile.username}
                likesCount={profile.likesCount}
                dislikesCount={profile.dislikesCount}
                userReaction={profile.userReaction}
                disabled={!isAuthenticated || profile.isOwner}
              />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 text-xs font-medium text-muted-foreground backdrop-blur">
                  <Eye className="h-3.5 w-3.5" />
                  {formatNumber(profile.viewsCount)}
                </span>
              </TooltipTrigger>
              <TooltipContent>Просмотры профиля</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex flex-col items-center px-4 pb-6 text-center sm:px-6">
          <div className="relative -mt-12 sm:-mt-16">
            <AvatarWithSkin user={profile} size="lg" />
            <span
              className={cn(
                'absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-card',
                profile.isOnlineInGame ? 'bg-emerald-400' : 'bg-muted-foreground',
              )}
              aria-hidden
            />
          </div>

          {profile.shortId != null ? (
            <span className="mt-3 rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
              #{profile.shortId}
            </span>
          ) : null}

          <div className="mt-2">
            <ColoredUsername
              user={profile}
              size="lg"
              linkToProfile={false}
              badges={profile.badges}
              maxBadges={3}
              className="justify-center"
            />
          </div>

          {profile.customPosition ? (
            <p
              className="mt-1 text-sm italic leading-snug"
              style={{ color: profile.customPosition.color ?? 'hsl(var(--primary))' }}
            >
              {profile.customPosition.name}
            </p>
          ) : (
            <p
              className="mt-1 text-[13px] font-medium leading-snug"
              style={{ color: profile.position.color }}
            >
              {profile.position.displayName}
            </p>
          )}

          <DepartmentBadgesList
            departments={profile.departments ?? []}
            className="mt-2 justify-center"
          />

          {profile.mediaBadges.length > 0 ? (
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
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
          ) : null}

          <ProfileStatus status={profile.statusText} className="mt-3 max-w-xl" />

          <p className="mt-2 text-sm text-muted-foreground">
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

          {profile.lastLoginAt ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Последний вход:{' '}
              {format(new Date(profile.lastLoginAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
            </p>
          ) : null}

          {statsHidden ? (
            <p className="mt-5 text-sm text-muted-foreground">Статистика скрыта</p>
          ) : (
            <div className="mt-6 grid w-full max-w-2xl grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              <HeaderStat
                label="Рубинов"
                value={profile.statistics?.coins ?? 0}
                tip="Баланс рубинов"
              />
              <HeaderStat
                label="Убийств"
                value={profile.statistics?.kills ?? 0}
                tip="Количество убийств"
              />
              <HeaderStat
                label="Смертей"
                value={profile.statistics?.deaths ?? 0}
                tip="Количество смертей"
              />
              <HeaderStat
                label="У/С"
                value={(profile.statistics?.killDeathRatio ?? 0).toFixed(2)}
                tip="Соотношение убийств к смертям"
              />
              <HeaderStat
                label="Попаданий"
                value={profile.statistics?.hits ?? 0}
                tip="Попаданий по игрокам"
              />
              <HeaderStat
                label="Друзей"
                value={friendsCount === null ? '—' : friendsCount}
                tip="Друзей в сети"
              />
              <HeaderStat
                label="Время в игре"
                value={formatPlayTime(profile.statistics?.playTime ?? 0)}
                tip="Суммарное время в игре"
              />
              <HeaderStat
                label="Регистрация"
                value={format(new Date(profile.createdAt), 'dd.MM.yyyy', { locale: ru })}
                tip="Дата регистрации"
              />
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <AwardsList awards={profile.awards} size={28} />
            {isAuthenticated && !profile.isOwner ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  disabled={createConversation.isPending}
                  onClick={async () => {
                    try {
                      const conversation = await createConversation.mutateAsync(profile.username);
                      window.location.assign(`/messages?conversation=${conversation.id}`);
                    } catch (error) {
                      toast.error(extractErrorMessage(error, 'Не удалось открыть диалог'));
                    }
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                  Написать
                </Button>
                <FriendButton username={profile.username} />
                <ReportProfileDialog username={profile.username} />
              </>
            ) : null}
            {me && !profile.isOwner && hasRoleGroup(me.roleGroup, RoleGroup.HELPER) ? (
              <UserContextMenu
                user={{ id: profile.id, username: profile.username, avatar: profile.avatar }}
              >
                <Button variant="secondary" size="sm" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Модерация
                </Button>
              </UserContextMenu>
            ) : null}
          </div>

          {socialLinks.length > 0 ? (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-4 border-t border-border pt-5">
              {socialLinks.map((link) => (
                <a
                  key={link.platform}
                  href={socialHref(link.platform, link.value)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {socialPlatformLabels[link.platform]}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Информация</TabsTrigger>
          <TabsTrigger value="activity">Активность</TabsTrigger>
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
                    <dd style={{ color: profile.position.color }}>
                      {profile.position.displayName}
                    </dd>
                    <dt className="text-muted-foreground">Последний сервер</dt>
                    <dd>{profile.statistics?.lastServer ?? '—'}</dd>
                    <dt className="text-muted-foreground">Клан</dt>
                    <dd className="text-muted-foreground">В разработке</dd>
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Услуги</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wrench className="h-4 w-4" />В разработке
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

              {otherSocials.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Соц сети</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-3">
                    {otherSocials.map((link) => (
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

              {userAchievements.data && userAchievements.data.showcase.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Витрина достижений</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AchievementShowcase achievements={userAchievements.data.showcase} />
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <ProfileActivitySection username={profile.username} />
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
        <h2 className="text-lg font-semibold text-foreground">Комментарии</h2>
        <CommentsList
          profileUsername={profile.username}
          commentsEnabled={profile.commentsEnabled}
          commentsForcedReason={profile.commentsForcedReason}
        />
      </section>
    </div>
  );
}

function HeaderStat({ label, value, tip }: { label: string; value: number | string; tip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-default">
          <p className="text-lg font-semibold tabular-nums text-foreground sm:text-xl">
            {typeof value === 'number' ? formatNumber(value) : value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  );
}

/** Minutes -> "354.6ч" (playTime is stored in minutes) */
function formatPlayTime(minutes: number): string {
  return `${(minutes / 60).toFixed(1)}ч`;
}

function ProfileActivitySection({ username }: { username: string }) {
  const query = useUserActivity(username, { limit: 10 });
  const items = query.data?.pages.flatMap((page) => page.data) ?? [];

  if (query.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState title="Пока нет активности" description="События этого игрока появятся здесь" />
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <ActivityCard key={item.id} activity={item} showComments={false} />
      ))}
      {query.hasNextPage ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="secondary"
            onClick={() => void query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
          >
            {query.isFetchingNextPage ? 'Загрузка…' : 'Показать ещё'}
          </Button>
        </div>
      ) : null}
    </div>
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
              {img ? <Image src={img} alt="" fill className="object-cover" unoptimized /> : null}
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/store/product/${product.slug}`}
                className="font-medium text-foreground hover:underline"
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
