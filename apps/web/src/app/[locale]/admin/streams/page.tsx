'use client';

import { StreamPlatform, type StreamChannel } from '@twomc/shared';
import { Plus, Radio, RefreshCw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { api, extractErrorMessage } from '@/lib/api';

type StreamForm = {
  platform: StreamPlatform;
  channelKey: string;
  channelUrl: string;
  displayName: string;
  avatarUrl: string;
  isPartner: boolean;
};

const emptyForm: StreamForm = {
  platform: StreamPlatform.TWITCH,
  channelKey: '',
  channelUrl: '',
  displayName: '',
  avatarUrl: '',
  isPartner: false,
};

export default function AdminStreamsPage() {
  const [channels, setChannels] = useState<StreamChannel[]>([]);
  const [form, setForm] = useState<StreamForm>(emptyForm);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setChannels((await api.get<StreamChannel[]>('/admin/streams')).data);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить каналы'));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    setBusy(true);
    try {
      await api.post('/admin/streams', {
        ...form,
        avatarUrl: form.avatarUrl || undefined,
      });
      setForm(emptyForm);
      toast.success('Канал добавлен');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось добавить канал'));
    } finally {
      setBusy(false);
    }
  };

  const update = async (
    id: string,
    patch: Partial<Pick<StreamChannel, 'isActive' | 'isPartner'>>,
  ) => {
    try {
      await api.patch(`/admin/streams/${id}`, patch);
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось обновить канал'));
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Удалить канал из интеграции?')) return;
    try {
      await api.delete(`/admin/streams/${id}`);
      toast.success('Канал удалён');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось удалить канал'));
    }
  };

  const refresh = async () => {
    setBusy(true);
    try {
      const { data } = await api.post<{ checked: number; live: number }>('/admin/streams/refresh');
      toast.success(`Проверено: ${data.checked}. В эфире: ${data.live}`);
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось обновить эфиры'));
    } finally {
      setBusy(false);
    }
  };

  const canCreate = form.channelKey.trim() && form.channelUrl.trim() && form.displayName.trim();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl">Стримы</h1>
          <p className="text-sm text-muted-foreground">Twitch и YouTube-эфиры партнёров проекта</p>
        </div>
        <Button variant="secondary" onClick={() => void refresh()} disabled={busy}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Проверить эфиры
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Добавить канал
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Платформа</Label>
            <Select
              value={form.platform}
              onValueChange={(platform: StreamPlatform) =>
                setForm((value) => ({ ...value, platform }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={StreamPlatform.TWITCH}>Twitch</SelectItem>
                <SelectItem value={StreamPlatform.YOUTUBE}>YouTube</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Название</Label>
            <Input
              value={form.displayName}
              onChange={(event) =>
                setForm((value) => ({ ...value, displayName: event.target.value }))
              }
              placeholder="Название канала"
            />
          </div>
          <div className="space-y-2">
            <Label>
              {form.platform === StreamPlatform.TWITCH ? 'Логин Twitch' : 'ID канала YouTube'}
            </Label>
            <Input
              value={form.channelKey}
              onChange={(event) =>
                setForm((value) => ({ ...value, channelKey: event.target.value }))
              }
              placeholder={form.platform === StreamPlatform.TWITCH ? 'twomc' : 'UC…'}
            />
          </div>
          <div className="space-y-2">
            <Label>Ссылка на канал</Label>
            <Input
              value={form.channelUrl}
              onChange={(event) =>
                setForm((value) => ({ ...value, channelUrl: event.target.value }))
              }
              placeholder="https://…"
            />
          </div>
          <div className="space-y-2">
            <Label>Ссылка на аватар (необязательно)</Label>
            <Input
              value={form.avatarUrl}
              onChange={(event) =>
                setForm((value) => ({ ...value, avatarUrl: event.target.value }))
              }
              placeholder="https://…"
            />
          </div>
          <label className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm">
            Партнёр TWOMC.SU
            <Switch
              checked={form.isPartner}
              onCheckedChange={(isPartner) => setForm((value) => ({ ...value, isPartner }))}
            />
          </label>
          <div className="md:col-span-2">
            <Button onClick={() => void create()} disabled={!canCreate || busy}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить канал
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {channels.map((channel) => (
          <Card key={channel.id} className={!channel.isActive ? 'opacity-60' : undefined}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${channel.isLive ? 'bg-red-500/15 text-red-400' : 'bg-white/5 text-muted-foreground'}`}
                  >
                    <Radio className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{channel.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {channel.platform} · {channel.channelKey}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Удалить"
                  onClick={() => void remove(channel.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span
                  className={`rounded-full px-2.5 py-1 ${channel.isLive ? 'bg-red-500/15 text-red-300' : 'bg-white/5 text-muted-foreground'}`}
                >
                  {channel.isLive ? `В эфире · ${channel.viewerCount}` : 'Не в эфире'}
                </span>
                {channel.checkError ? (
                  <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-amber-300">
                    {channel.checkError}
                  </span>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center justify-between text-sm">
                  Активен
                  <Switch
                    checked={channel.isActive}
                    onCheckedChange={(isActive) => void update(channel.id, { isActive })}
                  />
                </label>
                <label className="flex items-center justify-between text-sm">
                  Партнёр
                  <Switch
                    checked={channel.isPartner}
                    onCheckedChange={(isPartner) => void update(channel.id, { isPartner })}
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {!channels.length ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">
          Каналы ещё не добавлены
        </div>
      ) : null}
    </div>
  );
}
