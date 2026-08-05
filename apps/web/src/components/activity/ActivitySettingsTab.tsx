'use client';

import {
  ActivityVisibility,
  type ActivityFeedSettings,
} from '@twomc/shared';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useActivitySettings,
  useUpdateActivitySettings,
} from '@/hooks/activity';

const showFields: Array<{
  key: keyof ActivityFeedSettings;
  label: string;
}> = [
  { key: 'showPurchases', label: 'Покупки' },
  { key: 'showAchievements', label: 'Достижения' },
  { key: 'showBadges', label: 'Бейджи' },
  { key: 'showAwards', label: 'Награды' },
  { key: 'showGifts', label: 'Подарки' },
  { key: 'showFriendships', label: 'Дружба' },
  { key: 'showProfileUpdates', label: 'Обновления профиля' },
  { key: 'showMilestones', label: 'Вехи' },
  { key: 'showServerActivity', label: 'Активность на сервере' },
];

const privacyFields: Array<{
  key: keyof ActivityFeedSettings;
  label: string;
}> = [
  { key: 'purchasesVisibility', label: 'Покупки' },
  { key: 'achievementsVisibility', label: 'Достижения' },
  { key: 'badgesVisibility', label: 'Бейджи' },
  { key: 'giftsVisibility', label: 'Подарки' },
  { key: 'friendshipsVisibility', label: 'Дружба' },
  { key: 'profileUpdatesVisibility', label: 'Обновления профиля' },
];

const visibilityOptions = [
  { value: ActivityVisibility.PUBLIC, label: 'Все' },
  { value: ActivityVisibility.FRIENDS, label: 'Друзья' },
  { value: ActivityVisibility.PRIVATE, label: 'Никто' },
];

export function ActivitySettingsTab() {
  const { data, isLoading } = useActivitySettings(true);
  const update = useUpdateActivitySettings();

  const patch = async (payload: Partial<ActivityFeedSettings>) => {
    try {
      await update.mutateAsync(payload);
      toast.success('Настройки сохранены');
    } catch {
      toast.error('Не удалось сохранить');
    }
  };

  if (isLoading || !data) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-2xl glass-medium p-5">
        <div>
          <h3 className="text-base font-semibold text-white">Что показывать в моей ленте</h3>
          <p className="text-sm text-muted-foreground">
            Управляет созданием вашей публичной активности
          </p>
        </div>
        <div className="space-y-3">
          {showFields.map((field) => (
            <div key={field.key} className="flex items-center justify-between gap-4">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Switch
                id={field.key}
                checked={Boolean(data[field.key])}
                onCheckedChange={(checked) =>
                  void patch({ [field.key]: checked } as Partial<ActivityFeedSettings>)
                }
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl glass-medium p-5">
        <div>
          <h3 className="text-base font-semibold text-white">Приватность моей активности</h3>
          <p className="text-sm text-muted-foreground">Кто видит ваши события</p>
        </div>
        <div className="space-y-5">
          {privacyFields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label>{field.label}</Label>
              <RadioGroup
                value={String(data[field.key])}
                onValueChange={(value) =>
                  void patch({
                    [field.key]: value as ActivityVisibility,
                  } as Partial<ActivityFeedSettings>)
                }
                className="flex flex-wrap gap-4"
              >
                {visibilityOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <RadioGroupItem value={option.value} />
                    {option.label}
                  </label>
                ))}
              </RadioGroup>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl glass-medium p-5">
        <h3 className="text-base font-semibold text-white">Уведомления</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="notifyOnComment">Уведомлять о комментариях</Label>
            <Switch
              id="notifyOnComment"
              checked={data.notifyOnComment}
              onCheckedChange={(checked) => void patch({ notifyOnComment: checked })}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="notifyOnReaction">Уведомлять о реакциях</Label>
            <Switch
              id="notifyOnReaction"
              checked={data.notifyOnReaction}
              onCheckedChange={(checked) => void patch({ notifyOnReaction: checked })}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
