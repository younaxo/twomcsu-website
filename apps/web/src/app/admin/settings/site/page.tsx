'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useSiteSettings, useUpdateSiteSettings } from '@/hooks/admin';
import type { SiteSettings } from '@/hooks/admin';
import { api } from '@/lib/api';

type FormState = Omit<SiteSettings, 'updatedAt'>;

function toFormState(data: SiteSettings): FormState {
  const { updatedAt: _updatedAt, ...rest } = data;
  return rest;
}

export default function AdminSiteSettingsPage() {
  const { data, isLoading } = useSiteSettings();
  const update = useUpdateSiteSettings();
  const [form, setForm] = useState<FormState | null>(null);
  const [ipInput, setIpInput] = useState('');

  useEffect(() => {
    if (data) setForm(toFormState(data));
  }, [data]);

  if (isLoading || !form) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  const patch = (partial: Partial<FormState>) => {
    setForm((prev) => (prev ? { ...prev, ...partial } : prev));
  };

  const save = () => {
    update.mutate(form, {
      onSuccess: () => toast.success('Настройки сохранены'),
      onError: () => toast.error('Не удалось сохранить'),
    });
  };

  const saveIpWhitelist = async () => {
    const ips = ipInput
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      await api.post('/admin/security/ip-whitelist', { ips });
      patch({ ipWhitelist: ips });
      toast.success('IP whitelist обновлён');
    } catch {
      toast.error('Не удалось обновить whitelist');
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Настройки сайта"
        description="Глобальные параметры платформы"
        actions={
          <Button type="button" onClick={save} disabled={update.isPending}>
            {update.isPending ? 'Сохранение…' : 'Сохранить'}
          </Button>
        }
      />

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="glass-medium flex h-auto flex-wrap gap-1 p-1">
          <TabsTrigger value="general">Основные</TabsTrigger>
          <TabsTrigger value="contacts">Контакты</TabsTrigger>
          <TabsTrigger value="registration">Регистрация</TabsTrigger>
          <TabsTrigger value="features">Функции</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="notifications">Уведомления</TabsTrigger>
          <TabsTrigger value="security">Безопасность</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="glass-panel space-y-4 rounded-2xl p-5">
          <Field label="Название сайта">
            <Input value={form.siteName} onChange={(e) => patch({ siteName: e.target.value })} />
          </Field>
          <Field label="Описание">
            <Textarea
              value={form.siteDescription ?? ''}
              onChange={(e) => patch({ siteDescription: e.target.value || null })}
            />
          </Field>
          <Field label="Логотип URL">
            <Input
              value={form.siteLogo ?? ''}
              onChange={(e) => patch({ siteLogo: e.target.value || null })}
            />
          </Field>
          <Field label="Favicon URL">
            <Input
              value={form.siteFavicon ?? ''}
              onChange={(e) => patch({ siteFavicon: e.target.value || null })}
            />
          </Field>
        </TabsContent>

        <TabsContent value="contacts" className="glass-panel space-y-4 rounded-2xl p-5">
          <Field label="Email">
            <Input
              value={form.contactEmail ?? ''}
              onChange={(e) => patch({ contactEmail: e.target.value || null })}
            />
          </Field>
          <Field label="Discord invite">
            <Input
              value={form.discordInvite ?? ''}
              onChange={(e) => patch({ discordInvite: e.target.value || null })}
            />
          </Field>
          <Field label="VK группа">
            <Input
              value={form.vkGroup ?? ''}
              onChange={(e) => patch({ vkGroup: e.target.value || null })}
            />
          </Field>
          <Field label="Telegram">
            <Input
              value={form.telegramChannel ?? ''}
              onChange={(e) => patch({ telegramChannel: e.target.value || null })}
            />
          </Field>
          <Field label="YouTube">
            <Input
              value={form.youtubeChannel ?? ''}
              onChange={(e) => patch({ youtubeChannel: e.target.value || null })}
            />
          </Field>
        </TabsContent>

        <TabsContent value="registration" className="glass-panel space-y-4 rounded-2xl p-5">
          <ToggleField
            label="Регистрация включена"
            checked={form.registrationEnabled}
            onCheckedChange={(v) => patch({ registrationEnabled: v })}
          />
          <ToggleField
            label="Требуется одобрение"
            checked={form.registrationRequiresApproval}
            onCheckedChange={(v) => patch({ registrationRequiresApproval: v })}
          />
          <Field label="Лимит пользователей">
            <Input
              type="number"
              value={form.maxUsersLimit ?? ''}
              onChange={(e) =>
                patch({
                  maxUsersLimit: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </Field>
          <ToggleField
            label="Автомодерация"
            checked={form.autoModeration}
            onCheckedChange={(v) => patch({ autoModeration: v })}
          />
          <ToggleField
            label="Фильтр мата"
            checked={form.profanityFilter}
            onCheckedChange={(v) => patch({ profanityFilter: v })}
          />
        </TabsContent>

        <TabsContent value="features" className="glass-panel space-y-3 rounded-2xl p-5">
          {(
            [
              ['chatEnabled', 'Чат'],
              ['friendsEnabled', 'Друзья'],
              ['storeEnabled', 'Магазин'],
              ['commentsEnabled', 'Комментарии'],
              ['newsEnabled', 'Новости'],
              ['reportsEnabled', 'Обращения'],
            ] as const
          ).map(([key, label]) => (
            <ToggleField
              key={key}
              label={label}
              checked={form[key]}
              onCheckedChange={(v) => patch({ [key]: v })}
            />
          ))}
        </TabsContent>

        <TabsContent value="seo" className="glass-panel space-y-4 rounded-2xl p-5">
          <Field label="Meta title">
            <Input
              value={form.metaTitle ?? ''}
              onChange={(e) => patch({ metaTitle: e.target.value || null })}
            />
          </Field>
          <Field label="Meta description">
            <Textarea
              value={form.metaDescription ?? ''}
              onChange={(e) => patch({ metaDescription: e.target.value || null })}
            />
          </Field>
          <Field label="Ключевые слова (через запятую)">
            <Input
              value={form.metaKeywords.join(', ')}
              onChange={(e) =>
                patch({
                  metaKeywords: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </Field>
          <Field label="Google Analytics ID">
            <Input
              value={form.googleAnalyticsId ?? ''}
              onChange={(e) => patch({ googleAnalyticsId: e.target.value || null })}
            />
          </Field>
          <Field label="Yandex Metrika ID">
            <Input
              value={form.yandexMetrikaId ?? ''}
              onChange={(e) => patch({ yandexMetrikaId: e.target.value || null })}
            />
          </Field>
        </TabsContent>

        <TabsContent value="notifications" className="glass-panel rounded-2xl p-5">
          <ToggleField
            label="Уведомления по умолчанию включены"
            checked={form.defaultNotificationsEnabled}
            onCheckedChange={(v) => patch({ defaultNotificationsEnabled: v })}
          />
        </TabsContent>

        <TabsContent value="security" className="glass-panel space-y-4 rounded-2xl p-5">
          <ToggleField
            label="2FA для админов"
            checked={form.requireAdmin2fa}
            onCheckedChange={(v) => patch({ requireAdmin2fa: v })}
          />
          <Field label="IP whitelist (по одному на строку)">
            <Textarea
              rows={6}
              value={ipInput || form.ipWhitelist.join('\n')}
              onChange={(e) => setIpInput(e.target.value)}
            />
          </Field>
          <Button type="button" variant="secondary" onClick={saveIpWhitelist}>
            Обновить whitelist
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
      <span className="text-sm text-white">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
