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
};

export default function AdminChatSettingsPage() {
  const [settings, setSettings] = useState<ChatSettings>({
    blacklist: '',
    previewWhitelist: '',
    rateLimitCount: 5,
    rateLimitWindowSec: 10,
  });

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<ChatSettings>('/admin/chat/settings');
      setSettings(data);
    } catch (error) {
      toast.error(extractErrorMessage(error, '╨¥╨╡ ╤â╨┤╨░╨╗╨╛╤ü╤î ╨╖╨░╨│╤Ç╤â╨╖╨╕╤é╤î ╨╜╨░╤ü╤é╤Ç╨╛╨╣╨║╨╕'));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    try {
      const { data } = await api.patch<ChatSettings>('/admin/chat/settings', settings);
      setSettings(data);
      toast.success('╨í╨╛╤à╤Ç╨░╨╜╨╡╨╜╨╛');
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="╨¥╨░╤ü╤é╤Ç╨╛╨╣╨║╨╕ ╤ç╨░╤é╨░" description="Anti-spam ╨╕ ╨┐╤Ç╨╡╨▓╤î╤Ä ╤ü╤ü╤ï╨╗╨╛╨║" />
      <div className="space-y-4 rounded-xl border border-border bg-card p-4">
        <div className="space-y-1">
          <Label>╨º╤æ╤Ç╨╜╤ï╨╣ ╤ü╨┐╨╕╤ü╨╛╨║ ╤ü╨╗╨╛╨▓ (╤ç╨╡╤Ç╨╡╨╖ ╨╖╨░╨┐╤Å╤é╤â╤Ä)</Label>
          <Textarea
            value={settings.blacklist}
            onChange={(e) => setSettings({ ...settings, blacklist: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label>Whitelist ╨┤╨╛╨╝╨╡╨╜╨╛╨▓ ╨┤╨╗╤Å preview</Label>
          <Input
            value={settings.previewWhitelist}
            onChange={(e) => setSettings({ ...settings, previewWhitelist: e.target.value })}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>╨¢╨╕╨╝╨╕╤é ╤ü╨╛╨╛╨▒╤ë╨╡╨╜╨╕╨╣</Label>
            <Input
              type="number"
              value={settings.rateLimitCount}
              onChange={(e) =>
                setSettings({ ...settings, rateLimitCount: Number(e.target.value) || 5 })
              }
            />
          </div>
          <div className="space-y-1">
            <Label>╨₧╨║╨╜╨╛, ╤ü╨╡╨║</Label>
            <Input
              type="number"
              value={settings.rateLimitWindowSec}
              onChange={(e) =>
                setSettings({ ...settings, rateLimitWindowSec: Number(e.target.value) || 10 })
              }
            />
          </div>
        </div>
        <Button onClick={() => void save()}>╨í╨╛╤à╤Ç╨░╨╜╨╕╤é╤î</Button>
      </div>
    </div>
  );
}
