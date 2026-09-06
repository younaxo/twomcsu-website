'use client';

import type { VoteSite } from '@twomc/shared';
import { Copy, KeyRound, Plus, Trash2, Vote } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { api, extractErrorMessage } from '@/lib/api';

type AdminVoteSite = VoteSite & { _count: { votes: number } };
type VoteForm = {
  slug: string;
  name: string;
  description: string;
  url: string;
  logoUrl: string;
  rewardCoins: number;
  cooldownHours: number;
  sortOrder: number;
};
const emptyForm: VoteForm = {
  slug: '',
  name: '',
  description: '',
  url: '',
  logoUrl: '',
  rewardCoins: 10,
  cooldownHours: 24,
  sortOrder: 0,
};

export default function AdminVotingPage() {
  const [sites, setSites] = useState<AdminVoteSite[]>([]);
  const [form, setForm] = useState<VoteForm>(emptyForm);
  const [secret, setSecret] = useState<{ slug: string; value: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setSites((await api.get<AdminVoteSite[]>('/admin/voting/sites')).data);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить сайты голосования'));
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    setBusy(true);
    try {
      const { data } = await api.post<{ site: AdminVoteSite; webhookSecret: string }>(
        '/admin/voting/sites',
        { ...form, description: form.description || undefined, logoUrl: form.logoUrl || undefined },
      );
      setSecret({ slug: data.site.slug, value: data.webhookSecret });
      setForm(emptyForm);
      toast.success('Сайт голосования добавлен');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось добавить сайт'));
    } finally {
      setBusy(false);
    }
  };

  const update = async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/admin/voting/sites/${id}`, { isActive });
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось обновить сайт'));
    }
  };
  const rotate = async (site: AdminVoteSite) => {
    if (!window.confirm('Старый webhook-секрет перестанет работать. Продолжить?')) return;
    try {
      const { data } = await api.post<{ webhookSecret: string }>(
        `/admin/voting/sites/${site.id}/rotate-secret`,
      );
      setSecret({ slug: site.slug, value: data.webhookSecret });
      toast.success('Секрет обновлён');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось обновить секрет'));
    }
  };
  const remove = async (id: string) => {
    if (!window.confirm('Удалить сайт и всю историю голосов по нему?')) return;
    try {
      await api.delete(`/admin/voting/sites/${id}`);
      toast.success('Сайт удалён');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось удалить сайт'));
    }
  };
  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    toast.success('Скопировано');
  };
  const canCreate = form.slug.trim() && form.name.trim() && form.url.trim();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Голосование</h1>
        <p className="text-sm text-muted-foreground">
          Сайты мониторинга, награды и безопасные webhook-интеграции
        </p>
      </div>
      {secret ? (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-5 w-5 text-amber-400" />
              Сохраните новый секрет
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Он показывается только сейчас. Webhook:{' '}
              <code className="break-all text-white">/voting/webhook/{secret.slug}</code>,
              заголовок: <code className="text-white">x-vote-secret</code>.
            </p>
            <div className="flex gap-2">
              <Input readOnly value={secret.value} className="font-mono text-xs" />
              <Button
                variant="secondary"
                size="icon"
                onClick={() => void copy(secret.value)}
                aria-label="Скопировать"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSecret(null)}>
              Я сохранил секрет
            </Button>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Добавить сайт
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Название</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
              placeholder="TopCraft"
            />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm((v) => ({ ...v, slug: e.target.value.toLowerCase() }))}
              placeholder="topcraft"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Ссылка для голосования</Label>
            <Input
              value={form.url}
              onChange={(e) => setForm((v) => ({ ...v, url: e.target.value }))}
              placeholder="https://site.ru/vote/{username}"
            />
            <p className="text-xs text-muted-foreground">
              Используйте <code>{'{username}'}</code>, чтобы автоматически подставить ник.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Логотип (необязательно)</Label>
            <Input
              value={form.logoUrl}
              onChange={(e) => setForm((v) => ({ ...v, logoUrl: e.target.value }))}
              placeholder="https://…"
            />
          </div>
          <div className="space-y-2">
            <Label>Описание</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))}
              placeholder="Короткое описание"
            />
          </div>
          <div className="space-y-2">
            <Label>Награда, рубины</Label>
            <Input
              type="number"
              min={0}
              value={form.rewardCoins}
              onChange={(e) => setForm((v) => ({ ...v, rewardCoins: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Перерыв, часов</Label>
            <Input
              type="number"
              min={1}
              max={168}
              value={form.cooldownHours}
              onChange={(e) => setForm((v) => ({ ...v, cooldownHours: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Порядок</Label>
            <Input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((v) => ({ ...v, sortOrder: Number(e.target.value) }))}
            />
          </div>
          <div className="self-end">
            <Button onClick={() => void create()} disabled={!canCreate || busy}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить сайт
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        {sites.map((site) => (
          <Card key={site.id} className={!site.isActive ? 'opacity-60' : undefined}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Vote className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{site.name}</p>
                    <p className="text-xs text-muted-foreground">
                      /{site.slug} · Голосов: {site._count.votes}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void remove(site.id)}
                  aria-label="Удалить"
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-white/5 px-2.5 py-1">
                  {site.rewardCoins} рубинов
                </span>
                <span className="rounded-full bg-white/5 px-2.5 py-1">
                  Раз в {site.cooldownHours} ч.
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-3 text-sm">
                  Активен
                  <Switch
                    checked={site.isActive}
                    onCheckedChange={(isActive) => void update(site.id, isActive)}
                  />
                </label>
                <Button variant="secondary" size="sm" onClick={() => void rotate(site)}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Новый секрет
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {!sites.length ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">
          Сайты голосования ещё не добавлены
        </div>
      ) : null}
    </div>
  );
}
