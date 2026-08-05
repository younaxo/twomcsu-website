'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { api, extractErrorMessage } from '@/lib/api';

const KEYS = [
  { key: 'siteName', label: 'Название сайта' },
  { key: 'logoUrl', label: 'Логотип URL' },
  { key: 'contactEmail', label: 'Контактный email' },
  { key: 'discordInvite', label: 'Discord invite' },
  { key: 'vkUrl', label: 'VK' },
  { key: 'telegramUrl', label: 'Telegram' },
] as const;

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maxUsers, setMaxUsers] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<Record<string, string>>('/admin/settings');
      setValues(data);
      setRegistrationEnabled(data.registrationEnabled !== 'false');
      setMaintenanceMode(data.maintenanceMode === 'true');
      setMaxUsers(data.maxUsers ?? '');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить настройки'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const payload: Record<string, string> = {
        ...values,
        registrationEnabled: registrationEnabled ? 'true' : 'false',
        maintenanceMode: maintenanceMode ? 'true' : 'false',
        maxUsers: maxUsers || '0',
      };
      const { data } = await api.patch<Record<string, string>>('/admin/settings', payload);
      setValues(data);
      toast.success('Настройки сохранены');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось сохранить'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Настройки" description="Общие параметры сайта" />
      <div className="max-w-xl space-y-4 rounded-xl border border-border bg-card/40 p-4">
        {KEYS.map((item) => (
          <div key={item.key} className="space-y-1.5">
            <Label>{item.label}</Label>
            <Input
              value={values[item.key] ?? ''}
              disabled={loading}
              onChange={(e) => setValues({ ...values, [item.key]: e.target.value })}
            />
          </div>
        ))}
        <div className="space-y-1.5">
          <Label>Лимит пользователей (0 = без лимита)</Label>
          <Input
            type="number"
            value={maxUsers}
            disabled={loading}
            onChange={(e) => setMaxUsers(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={registrationEnabled} onCheckedChange={setRegistrationEnabled} />
          <Label>Регистрация включена</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
          <Label>Режим обслуживания</Label>
        </div>
        <Button onClick={() => void save()} disabled={saving || loading}>
          Сохранить
        </Button>
      </div>
    </div>
  );
}
