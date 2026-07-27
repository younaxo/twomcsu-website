'use client';

import {
  FriendRequestPolicy,
  MediaGroup,
  type MyProfile,
  ProfileVisibility,
  type SessionInfo,
} from '@twomc/shared';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Globe, Lock, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { BannerPresetPicker } from '@/components/profile/BannerPresetPicker';
import { BannerUpload } from '@/components/profile/BannerUpload';
import { CountrySelect } from '@/components/profile/CountrySelect';
import { DateBirthPicker } from '@/components/profile/DateBirthPicker';
import { GenderSelect } from '@/components/profile/GenderSelect';
import { SocialLinksEditor } from '@/components/profile/SocialLinksEditor';
import { CaptchaField, CaptchaFieldHandle } from '@/components/shared/CaptchaField';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { api, extractErrorMessage } from '@/lib/api';
import { mediaGroupLabels } from '@/lib/profile';
import { cn } from '@/lib/utils';
import { checkPasswordPair } from '@/lib/validation';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Введите текущий пароль'),
    newPassword: z.string(),
    confirmPassword: z.string(),
    captchaToken: z.string().min(1, 'Подтвердите, что вы не робот'),
  })
  .superRefine((values, ctx) => {
    checkPasswordPair(ctx, values.newPassword, values.confirmPassword, 'newPassword');
  });

type PasswordValues = z.infer<typeof passwordSchema>;

function parseDevice(userAgent: string | null): string {
  if (!userAgent) return 'Неизвестное устройство';
  if (/Mobile|Android|iPhone/i.test(userAgent)) return 'Мобильное устройство';
  if (/Windows/i.test(userAgent)) return 'Windows';
  if (/Mac OS/i.test(userAgent)) return 'macOS';
  if (/Linux/i.test(userAgent)) return 'Linux';
  return 'Компьютер';
}

function parseBrowser(userAgent: string | null): string {
  if (!userAgent) return '—';
  if (/Edg\//i.test(userAgent)) return 'Edge';
  if (/Chrome\//i.test(userAgent)) return 'Chrome';
  if (/Firefox\//i.test(userAgent)) return 'Firefox';
  if (/Safari\//i.test(userAgent)) return 'Safari';
  return 'Браузер';
}

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const captcha = useRef<CaptchaFieldHandle>(null);

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      captchaToken: '',
    },
  });

  const load = useCallback(async () => {
    try {
      const [{ data: me }, { data: sessionRows }] = await Promise.all([
        api.get<MyProfile>('/users/me/profile'),
        api.get<SessionInfo[]>('/auth/sessions'),
      ]);
      setProfile(me);
      setSessions(sessionRows);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить настройки'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { data } = await api.patch<MyProfile>('/users/me/profile', {
        minecraftNick: profile.minecraftNick,
        statusText: profile.statusText,
        bio: profile.bio,
        country: profile.country,
        city: profile.city,
        gender: profile.gender,
        birthDate: profile.birthDate,
        showBirthDate: profile.showBirthDate,
        profileVisibility: profile.profileVisibility,
        friendRequestPolicy: profile.friendRequestPolicy,
        hideEmail: profile.hideEmail,
        hideCountry: profile.hideCountry,
        hideCity: profile.hideCity,
        hideBirthDate: profile.hideBirthDate,
        hideGender: profile.hideGender,
        hideStatistics: profile.hideStatistics,
        hideSocials: profile.hideSocials,
        hideInventory: profile.hideInventory,
        hideServices: profile.hideServices,
        hideComments: profile.hideComments,
      });
      setProfile(data);
      toast.success('Профиль сохранён');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось сохранить профиль'));
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (values: PasswordValues) => {
    try {
      await api.post('/auth/change-password', values);
      toast.success('Пароль изменён');
      await logout();
      router.push('/login');
    } catch (error) {
      captcha.current?.reset();
      toast.error(extractErrorMessage(error, 'Не удалось сменить пароль'));
    }
  };

  const revokeSession = async (id: string) => {
    try {
      await api.delete(`/auth/sessions/${id}`);
      setSessions((prev) => prev.filter((row) => row.id !== id));
      toast.success('Сессия завершена');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось завершить сессию'));
    }
  };

  const revokeAll = async () => {
    try {
      await api.delete('/auth/sessions');
      toast.success('Все сессии завершены');
      await logout();
      router.push('/login');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось выйти со всех устройств'));
    }
  };

  if (isLoading || !profile) {
    return <Skeleton className="h-[32rem] w-full" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Настройки профиля</h1>
        <p className="text-sm text-muted-foreground">Управляйте внешним видом и приватностью аккаунта</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="profile">Профиль</TabsTrigger>
          <TabsTrigger value="privacy">Приватность</TabsTrigger>
          <TabsTrigger value="socials">Соц сети</TabsTrigger>
          <TabsTrigger value="media">Медиа</TabsTrigger>
          <TabsTrigger value="security">Безопасность</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Аватар и баннер</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <AvatarUpload
                value={profile.avatar}
                onChange={(avatar) => setProfile({ ...profile, avatar })}
              />
              <BannerUpload
                value={profile.bannerUrl}
                onChange={(banner, bannerPreset) =>
                  setProfile({
                    ...profile,
                    banner,
                    bannerPreset,
                    bannerUrl: banner,
                  })
                }
              />
              <div className="space-y-2">
                <Label>Пресеты баннера</Label>
                <BannerPresetPicker
                  value={profile.bannerPreset}
                  onSelect={(presetId, imageUrl) =>
                    setProfile({
                      ...profile,
                      banner: null,
                      bannerPreset: presetId,
                      bannerUrl: imageUrl,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Основное</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Minecraft ник</Label>
                <Input
                  value={profile.minecraftNick ?? ''}
                  maxLength={16}
                  onChange={(event) =>
                    setProfile({ ...profile, minecraftNick: event.target.value || null })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Статус</Label>
                <Input
                  value={profile.statusText ?? ''}
                  maxLength={128}
                  placeholder="Что нового?"
                  onChange={(event) =>
                    setProfile({ ...profile, statusText: event.target.value || null })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>О себе</Label>
                <Textarea
                  value={profile.bio ?? ''}
                  maxLength={500}
                  onChange={(event) => setProfile({ ...profile, bio: event.target.value || null })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Страна</Label>
                  <CountrySelect
                    value={profile.country}
                    onChange={(country) => setProfile({ ...profile, country })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Город</Label>
                  <Input
                    value={profile.city ?? ''}
                    maxLength={100}
                    onChange={(event) =>
                      setProfile({ ...profile, city: event.target.value || null })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Пол</Label>
                  <GenderSelect
                    value={profile.gender}
                    onChange={(gender) => setProfile({ ...profile, gender })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Дата рождения</Label>
                  <DateBirthPicker
                    value={profile.birthDate}
                    onChange={(birthDate) => setProfile({ ...profile, birthDate })}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={profile.showBirthDate}
                  onCheckedChange={(checked) =>
                    setProfile({ ...profile, showBirthDate: checked === true })
                  }
                />
                Показывать возраст в профиле
              </label>
              <Button type="button" onClick={() => void saveProfile()} disabled={isSaving}>
                {isSaving ? 'Сохраняем...' : 'Сохранить'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Приватность</CardTitle>
              <CardDescription>Управляйте видимостью профиля и заявками в друзья</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-3">
                <div>
                  <p className="font-medium">Кто может видеть ваш профиль</p>
                  <p className="text-sm text-muted-foreground">Выберите уровень видимости страницы</p>
                </div>
                <RadioGroup
                  value={profile.profileVisibility}
                  onValueChange={(value) =>
                    setProfile({
                      ...profile,
                      profileVisibility: value as MyProfile['profileVisibility'],
                    })
                  }
                  className="grid gap-3"
                >
                  {(
                    [
                      {
                        value: ProfileVisibility.EVERYONE,
                        icon: Globe,
                        title: 'Все',
                        description: 'Ваш профиль виден всем пользователям',
                      },
                      {
                        value: ProfileVisibility.FRIENDS_ONLY,
                        icon: Users,
                        title: 'Только друзья',
                        description: 'Профиль виден только вашим друзьям',
                      },
                      {
                        value: ProfileVisibility.NOBODY,
                        icon: Lock,
                        title: 'Никто',
                        description: 'Профиль виден только вам',
                      },
                    ] as const
                  ).map((option) => {
                    const Icon = option.icon;
                    const selected = profile.profileVisibility === option.value;

                    return (
                      <label
                        key={option.value}
                        className={cn(
                          'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                          selected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-muted-foreground/40',
                        )}
                      >
                        <RadioGroupItem value={option.value} className="mt-1" />
                        <Icon
                          className={cn(
                            'mt-0.5 h-5 w-5 shrink-0',
                            selected ? 'text-primary' : 'text-muted-foreground',
                          )}
                        />
                        <div className="space-y-0.5">
                          <p className="font-medium leading-none">{option.title}</p>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="font-medium">Кто может отправлять вам заявки в друзья</p>
                  <p className="text-sm text-muted-foreground">
                    Это будет применяться после запуска системы друзей
                  </p>
                </div>
                <RadioGroup
                  value={profile.friendRequestPolicy}
                  onValueChange={(value) =>
                    setProfile({
                      ...profile,
                      friendRequestPolicy: value as MyProfile['friendRequestPolicy'],
                    })
                  }
                  className="grid gap-3"
                >
                  {(
                    [
                      {
                        value: FriendRequestPolicy.EVERYONE,
                        icon: Globe,
                        title: 'Все',
                        description: 'Любой пользователь может отправить заявку',
                      },
                      {
                        value: FriendRequestPolicy.FRIENDS_OF_FRIENDS,
                        icon: Users,
                        title: 'Только друзья друзей',
                        description: 'Заявку могут отправить только через общих друзей',
                      },
                      {
                        value: FriendRequestPolicy.NOBODY,
                        icon: Lock,
                        title: 'Никто',
                        description: 'Никто не может отправить заявку',
                      },
                    ] as const
                  ).map((option) => {
                    const Icon = option.icon;
                    const selected = profile.friendRequestPolicy === option.value;

                    return (
                      <label
                        key={option.value}
                        className={cn(
                          'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                          selected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-muted-foreground/40',
                        )}
                      >
                        <RadioGroupItem value={option.value} className="mt-1" />
                        <Icon
                          className={cn(
                            'mt-0.5 h-5 w-5 shrink-0',
                            selected ? 'text-primary' : 'text-muted-foreground',
                          )}
                        />
                        <div className="space-y-0.5">
                          <p className="font-medium leading-none">{option.title}</p>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="font-medium">Скрыть отдельные поля</p>
                  <p className="text-sm text-muted-foreground">
                    Доступно только при видимости «Все»
                  </p>
                </div>

                {profile.profileVisibility === ProfileVisibility.EVERYONE ? (
                  <div className="space-y-3">
                    {(
                      [
                        ['hideEmail', 'Скрыть email'],
                        ['hideCountry', 'Скрыть страну'],
                        ['hideCity', 'Скрыть город'],
                        ['hideBirthDate', 'Скрыть возраст'],
                        ['hideGender', 'Скрыть пол'],
                        ['hideStatistics', 'Скрыть статистику'],
                        ['hideSocials', 'Скрыть соц сети'],
                        ['hideInventory', 'Скрыть инвентарь'],
                        ['hideServices', 'Скрыть услуги'],
                        ['hideComments', 'Скрыть комментарии'],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={profile[key]}
                          onCheckedChange={(checked) =>
                            setProfile({ ...profile, [key]: checked === true })
                          }
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                    Настройка отдельных полей доступна только при видимости «Все»
                  </div>
                )}
              </div>

              <Button type="button" onClick={() => void saveProfile()} disabled={isSaving}>
                {isSaving ? 'Сохраняем...' : 'Сохранить'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="socials">
          <Card>
            <CardHeader>
              <CardTitle>Соц сети</CardTitle>
            </CardHeader>
            <CardContent>
              <SocialLinksEditor
                value={profile.socials}
                onChange={(socials) => setProfile({ ...profile, socials })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media">
          <MediaTab profile={profile} onRefresh={() => void load()} />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Смена пароля</CardTitle>
              <CardDescription>После смены все сессии будут завершены</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form
                  onSubmit={passwordForm.handleSubmit(changePassword)}
                  className="space-y-4"
                >
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Текущий пароль</FormLabel>
                        <FormControl>
                          <PasswordInput autoComplete="current-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Новый пароль</FormLabel>
                        <FormControl>
                          <PasswordInput autoComplete="new-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Повторите пароль</FormLabel>
                        <FormControl>
                          <PasswordInput autoComplete="new-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <CaptchaField ref={captcha} />
                  <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                    Изменить пароль
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle>Активные сессии</CardTitle>
                <CardDescription>Устройства, на которых выполнен вход</CardDescription>
              </div>
              <Button type="button" variant="destructive" size="sm" onClick={() => void revokeAll()}>
                Выйти со всех устройств
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="text-sm">
                    <p className="font-medium">
                      {parseDevice(session.userAgent)} · {parseBrowser(session.userAgent)}
                      {session.isCurrent ? (
                        <span className="ml-2 text-primary">(текущая)</span>
                      ) : null}
                    </p>
                    <p className="text-muted-foreground">
                      {session.ipAddress ?? '—'} ·{' '}
                      {format(new Date(session.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                    </p>
                  </div>
                  {!session.isCurrent ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void revokeSession(session.id)}
                    >
                      Завершить
                    </Button>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MediaTab({ profile, onRefresh }: { profile: MyProfile; onRefresh: () => void }) {
  const [mediaGroup, setMediaGroup] = useState<MediaGroup>(MediaGroup.YOUTUBE);
  const [channelUrl, setChannelUrl] = useState('');
  const [description, setDescription] = useState('');
  const [requests, setRequests] = useState<
    Array<{
      id: string;
      mediaGroup: MediaGroup;
      channelUrl: string;
      status: string;
      reviewNote: string | null;
      createdAt: string;
    }>
  >([]);
  const [isBusy, setBusy] = useState(false);

  useEffect(() => {
    void api
      .get('/users/me/media-requests')
      .then(({ data }) => setRequests(data))
      .catch(() => undefined);
  }, []);

  const submit = async () => {
    setBusy(true);
    try {
      await api.post('/users/me/media-request', { mediaGroup, channelUrl, description });
      toast.success('Заявка отправлена');
      setChannelUrl('');
      setDescription('');
      const { data } = await api.get('/users/me/media-requests');
      setRequests(data);
      onRefresh();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось отправить заявку'));
    } finally {
      setBusy(false);
    }
  };

  const statusLabel: Record<string, string> = {
    PENDING: 'Ожидает',
    APPROVED: 'Одобрена',
    REJECTED: 'Отклонена',
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Активные медиа-бейджи</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.mediaBadges.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока нет одобренных медиа-бейджей</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {profile.mediaBadges.map((badge) => (
                <li key={badge.mediaGroup}>
                  {mediaGroupLabels[badge.mediaGroup]} — {badge.channelUrl}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Подать заявку</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Платформа</Label>
            <Select value={mediaGroup} onValueChange={(value) => setMediaGroup(value as MediaGroup)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(MediaGroup).map((group) => (
                  <SelectItem key={group} value={group}>
                    {mediaGroupLabels[group]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>URL канала</Label>
            <Input value={channelUrl} onChange={(event) => setChannelUrl(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Описание</Label>
            <Textarea
              value={description}
              maxLength={500}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <Button type="button" onClick={() => void submit()} disabled={isBusy || !channelUrl}>
            Отправить заявку
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Мои заявки</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">Заявок пока нет</p>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="rounded-lg border border-border p-3 text-sm">
                <p className="font-medium">
                  {mediaGroupLabels[request.mediaGroup]} · {statusLabel[request.status]}
                </p>
                <p className="text-muted-foreground">{request.channelUrl}</p>
                {request.reviewNote ? (
                  <p className="mt-1 text-muted-foreground">Комментарий: {request.reviewNote}</p>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
