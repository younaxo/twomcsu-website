'use client';

import {
  DigestMode,
  NOTIFICATION_TYPE_LABELS,
  NotificationType,
  type NotificationTypeSetting,
} from '@twomc/shared';
import { toast } from 'sonner';
import { DiscordWebhookInput } from '@/components/notifications/DiscordWebhookInput';
import { PushSubscribeButton } from '@/components/notifications/PushSubscribeButton';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  useNotificationSettings,
  useResetNotificationSettings,
  useUpdateNotificationSettings,
  useUpdateNotificationTypeSetting,
} from '@/hooks/useNotificationSettings';
import { useAuth } from '@/hooks/useAuth';
import { extractErrorMessage } from '@/lib/api';
import {
  areNotificationSoundsEnabled,
  setNotificationSoundsEnabled,
} from '@/lib/notification-sounds';

const CHANNELS: Array<keyof NotificationTypeSetting> = [
  'site',
  'email',
  'push',
  'discord',
  'sound',
];

const CHANNEL_LABELS: Record<keyof NotificationTypeSetting, string> = {
  site: 'На сайте',
  email: 'Email',
  push: 'Push',
  discord: 'Discord',
  sound: 'Звук',
};

export function NotificationsSettingsTab() {
  const { user } = useAuth();
  const settings = useNotificationSettings(Boolean(user));
  const update = useUpdateNotificationSettings();
  const updateType = useUpdateNotificationTypeSetting();
  const reset = useResetNotificationSettings();

  if (settings.isLoading || !settings.data) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  const data = settings.data;

  const patch = async (payload: Parameters<typeof update.mutateAsync>[0]) => {
    try {
      await update.mutateAsync(payload);
      toast.success('Настройки сохранены');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось сохранить'));
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-2xl glass-medium p-5">
        <h2 className="text-lg font-medium text-white">Каналы доставки</h2>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-white">На сайте</p>
            <p className="text-xs text-muted-foreground">Всегда доступно в колокольчике</p>
          </div>
          <Switch checked disabled />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-white">Push</p>
            <p className="text-xs text-muted-foreground">Браузерные уведомления</p>
          </div>
          <div className="flex items-center gap-2">
            <PushSubscribeButton />
            <Switch
              checked={data.pushEnabled}
              onCheckedChange={(checked) => void patch({ pushEnabled: checked })}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-white">Email</p>
            <p className="text-xs text-muted-foreground">{user?.email ?? '—'}</p>
          </div>
          <Switch
            checked={data.emailEnabled}
            onCheckedChange={(checked) => void patch({ emailEnabled: checked })}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-white">Discord webhook</p>
              <p className="text-xs text-muted-foreground">Персональные уведомления в Discord</p>
            </div>
            <Switch
              checked={data.discordEnabled}
              onCheckedChange={(checked) => void patch({ discordEnabled: checked })}
            />
          </div>
          <DiscordWebhookInput value={data.discordWebhookUrl} enabled={data.discordEnabled} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-white">Звуковые</p>
            <p className="text-xs text-muted-foreground">Звук при новых уведомлениях</p>
          </div>
          <Switch
            checked={data.soundEnabled && areNotificationSoundsEnabled()}
            onCheckedChange={(checked) => {
              setNotificationSoundsEnabled(checked);
              void patch({ soundEnabled: checked });
            }}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-2xl glass-medium p-5">
        <h2 className="text-lg font-medium text-white">Режим отправки</h2>
        <RadioGroup
          value={data.digestMode}
          onValueChange={(value) => void patch({ digestMode: value as DigestMode })}
          className="space-y-2"
        >
          {(
            [
              [DigestMode.INSTANT, 'Мгновенно'],
              [DigestMode.HOURLY, 'Раз в час'],
              [DigestMode.DAILY, 'Раз в день'],
              [DigestMode.WEEKLY, 'Раз в неделю'],
            ] as const
          ).map(([value, label]) => (
            <div key={value} className="flex items-center gap-2">
              <RadioGroupItem value={value} id={`digest-${value}`} />
              <Label htmlFor={`digest-${value}`}>{label}</Label>
            </div>
          ))}
        </RadioGroup>
        {data.digestMode === DigestMode.DAILY ? (
          <div className="max-w-xs space-y-2">
            <Label>Время дайджеста</Label>
            <Input
              type="time"
              value={data.digestTime ?? '09:00'}
              onChange={(event) => void patch({ digestTime: event.target.value })}
            />
          </div>
        ) : null}
      </section>

      <section className="space-y-4 rounded-2xl glass-medium p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium text-white">Тихие часы</h2>
            <p className="text-xs text-muted-foreground">
              Email, push и Discord не отправляются в этот период
            </p>
          </div>
          <Switch
            checked={data.quietHoursEnabled}
            onCheckedChange={(checked) => void patch({ quietHoursEnabled: checked })}
          />
        </div>
        {data.quietHoursEnabled ? (
          <div className="grid max-w-md gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>С</Label>
              <Input
                type="time"
                value={data.quietHoursStart ?? '22:00'}
                onChange={(event) => void patch({ quietHoursStart: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>До</Label>
              <Input
                type="time"
                value={data.quietHoursEnd ?? '08:00'}
                onChange={(event) => void patch({ quietHoursEnd: event.target.value })}
              />
            </div>
          </div>
        ) : null}
      </section>

      <section className="space-y-4 rounded-2xl glass-medium p-5">
        <h2 className="text-lg font-medium text-white">Настройки по типам</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-muted-foreground">
                <th className="px-2 py-2 font-medium">Тип</th>
                {CHANNELS.map((channel) => (
                  <th key={channel} className="px-2 py-2 font-medium">
                    {CHANNEL_LABELS[channel]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(Object.keys(NOTIFICATION_TYPE_LABELS) as NotificationType[]).map((type) => {
                const typeSetting = data.typeSettings[type] ?? {};
                return (
                  <tr key={type} className="border-b border-white/5">
                    <td className="px-2 py-2 text-neutral-200">{NOTIFICATION_TYPE_LABELS[type]}</td>
                    {CHANNELS.map((channel) => (
                      <td key={channel} className="px-2 py-2">
                        <Checkbox
                          checked={typeSetting[channel] !== false}
                          onCheckedChange={(checked) =>
                            void updateType
                              .mutateAsync({
                                type,
                                setting: { ...typeSetting, [channel]: Boolean(checked) },
                              })
                              .catch((error) => toast.error(extractErrorMessage(error)))
                          }
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <Button
        type="button"
        variant="secondary"
        disabled={reset.isPending}
        onClick={() =>
          void reset
            .mutateAsync()
            .then(() => toast.success('Настройки сброшены'))
            .catch((error) => toast.error(extractErrorMessage(error)))
        }
      >
        Сбросить к дефолтам
      </Button>
    </div>
  );
}
