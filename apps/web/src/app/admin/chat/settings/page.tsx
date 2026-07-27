'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api, extractErrorMessage } from '@/lib/api';

type ChatSettings = {
  blacklist: string;
  previewWhitelist: string;
  rateLimitCount: number;
  rateLimitWindowSec: number;
  defaultSlowMode: number;
};

export default function AdminChatSettingsPage() {
  const [settings, setSettings] = useState<ChatSettings>({
    blacklist: '',
    previewWhitelist: '',
    rateLimitCount: 5,
    rateLimitWindowSec: 10,
    defaultSlowMode: 0,
  });

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<ChatSettings>('/admin/chat/settings');
      setSettings(data);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить настройки'));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    try {
      const { data } = await api.patch<ChatSettings>('/admin/chat/settings', settings);
      setSettings(data);
      toast.success('Сохранено');
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Настройки чата" description="Anti-spam и превью ссылок" />
      <div className="space-y-4 rounded-xl border border-border bg-card p-4">
        <div className="space-y-1">
          <Label>Чёрный список слов (через запятую)</Label>
          <Textarea
            value={settings.blacklist}
            onChange={(e) => setSettings({ ...settings, blacklist: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label>Whitelist доменов для preview</Label>
          <Input
            value={settings.previewWhitelist}
            onChange={(e) => setSettings({ ...settings, previewWhitelist: e.target.value })}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label>Лимит сообщений</Label>
            <Input
              type="number"
              value={settings.rateLimitCount}
              onChange={(e) =>
                setSettings({ ...settings, rateLimitCount: Number(e.target.value) || 5 })
              }
            />
          </div>
          <div className="space-y-1">
            <Label>Окно, сек</Label>
            <Input
              type="number"
              value={settings.rateLimitWindowSec}
              onChange={(e) =>
                setSettings({ ...settings, rateLimitWindowSec: Number(e.target.value) || 10 })
              }
            />
          </div>
          <div className="space-y-1">
            <Label>Slow mode по умолчанию</Label>
            <Input
              type="number"
              value={settings.defaultSlowMode}
              onChange={(e) =>
                setSettings({ ...settings, defaultSlowMode: Number(e.target.value) || 0 })
              }
            />
          </div>
        </div>
        <Button onClick={() => void save()}>Сохранить</Button>
      </div>
    </div>
  );
}
