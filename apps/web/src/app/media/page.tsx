'use client';

import { MediaGroup, type MediaPartnerDashboard } from '@twomc/shared';
import { Copy, Download, ExternalLink, Radio, Send, Video } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useMediaDashboard } from '@/hooks/useReferrals';
import { api, extractErrorMessage } from '@/lib/api';

const labels = { YOUTUBE: 'YouTube', TWITCH: 'Twitch', TIKTOK: 'TikTok' } as const;
const rankNames = ['Новичок', 'Автор', 'Партнёр', 'Амбассадор'];

export default function MediaPage() {
  const { user } = useAuth();
  const media = useMediaDashboard();
  const [platform, setPlatform] = useState<MediaGroup>(MediaGroup.TWITCH);
  const [channelUrl, setChannelUrl] = useState('');
  const [description, setDescription] = useState('');
  if (!user)
    return (
      <Card className="mx-auto mt-12 max-w-lg glass-strong">
        <CardContent className="p-8 text-center">
          <Video className="mx-auto h-12 w-12 text-primary" />
          <h1 className="font-display mt-4 text-3xl">Медиа-кабинет</h1>
          <Button asChild className="mt-5">
            <Link href="/login?next=/media">Войти</Link>
          </Button>
        </CardContent>
      </Card>
    );
  const apply = async () => {
    try {
      await api.post('/users/me/media-request', {
        mediaGroup: platform,
        channelUrl,
        description: description || undefined,
      });
      toast.success('Заявка отправлена');
      setChannelUrl('');
      setDescription('');
      await media.refetch();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось отправить заявку'));
    }
  };
  const copy = async (value: string | null) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    toast.success('Скопировано');
  };
  return (
    <div className="mx-auto max-w-6xl space-y-8 py-8">
      <header className="rounded-3xl border border-white/10 glass-strong p-7 sm:p-10">
        <p className="text-sm uppercase tracking-[.2em] text-primary">Twitch · TikTok · YouTube</p>
        <h1 className="font-display mt-3 text-4xl sm:text-5xl">Медиа-кабинет</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Управляйте каналами, следите за регистрациями по своему коду и создавайте рекламные
          баннеры.
        </p>
      </header>
      {media.data?.channels.map((channel) => (
        <MediaChannel key={channel.id} channel={channel} onCopy={copy} />
      ))}
      {media.data?.channels.length ? (
        <BannerGenerator code={media.data.channels[0].promoCode ?? ''} username={user.username} />
      ) : null}
      <Card className="glass-medium">
        <CardContent className="p-6">
          <h2 className="font-display text-2xl">Подать заявку</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Если у вас ещё нет медиа-промокода, отправьте канал на рассмотрение.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Платформа</Label>
              <Select value={platform} onValueChange={(value: MediaGroup) => setPlatform(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(MediaGroup).map((value) => (
                    <SelectItem key={value} value={value}>
                      {labels[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ссылка на канал</Label>
              <Input
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>О канале</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Расскажите об аудитории и контенте"
              />
            </div>
          </div>
          <Button className="mt-4" disabled={!channelUrl} onClick={() => void apply()}>
            <Send className="mr-2 h-4 w-4" />
            Отправить заявку
          </Button>
          <div className="mt-5 space-y-2">
            {media.data?.requests.map((request) => (
              <div
                key={request.id}
                className="flex justify-between rounded-xl bg-white/5 px-4 py-3 text-sm"
              >
                <span>{labels[request.mediaGroup]}</span>
                <span className="text-muted-foreground">{request.status}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MediaChannel({
  channel,
  onCopy,
}: {
  channel: MediaPartnerDashboard['channels'][number];
  onCopy: (value: string | null) => Promise<void>;
}) {
  return (
    <Card className="glass-medium">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15">
              {channel.mediaGroup === 'TWITCH' ? (
              <Radio className="h-6 w-6 text-primary" />
              ) : (
                <Video className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <p className="font-semibold">
                {labels[channel.mediaGroup]} · ранг {channel.rank}
              </p>
              <p className="text-sm text-primary">{rankNames[channel.rank - 1]}</p>
            </div>
          </div>
          <Button asChild variant="secondary">
            <a href={channel.channelUrl} target="_blank" rel="noreferrer">
              Канал
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-2xl font-semibold">{channel.registrations}</p>
            <p className="text-xs text-muted-foreground">Всего регистраций</p>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-2xl font-semibold">{channel.registrations30d}</p>
            <p className="text-xs text-muted-foreground">За 30 дней</p>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <p className="truncate text-xl font-semibold text-primary">
              {channel.promoCode ?? '—'}
            </p>
            <p className="text-xs text-muted-foreground">Промокод</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void onCopy(channel.referralUrl)}>
            <Copy className="mr-2 h-4 w-4" />
            Реферальная ссылка
          </Button>
          <Button variant="secondary" onClick={() => void onCopy(channel.registrationUrl)}>
            <Copy className="mr-2 h-4 w-4" />
            Ссылка регистрации
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BannerGenerator({ code, username }: { code: string; username: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [title, setTitle] = useState('Играй вместе со мной на TWOMC.SU');
  const [color, setColor] = useState('#F57C00');
  const draw = () => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const gradient = ctx.createLinearGradient(0, 0, c.width, c.height);
    gradient.addColorStop(0, '#090909');
    gradient.addColorStop(1, color);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    ctx.beginPath();
    ctx.arc(1050, 120, 250, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 50px Dela Gothic One, sans-serif';
    ctx.fillText(title.slice(0, 38), 60, 150);
    ctx.font = '32px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    ctx.fillText(`Автор: ${username}`, 60, 210);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText(`ПРОМОКОД: ${code}`, 60, 330);
  };
  const download = () => {
    draw();
    const link = document.createElement('a');
    link.download = `twomc-${code}.png`;
    link.href = canvas.current?.toDataURL('image/png') ?? '';
    link.click();
  };
  return (
    <Card className="glass-medium">
      <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 className="font-display text-2xl">Генератор баннера</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Настройте текст и цвет, затем скачайте PNG.
          </p>
          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label>Заголовок</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Акцент</Label>
              <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
            <Button onClick={download} disabled={!code}>
              <Download className="mr-2 h-4 w-4" />
              Скачать баннер
            </Button>
          </div>
        </div>
        <div>
          <canvas
            ref={canvas}
            width={1200}
            height={420}
            className="aspect-[20/7] w-full rounded-2xl border border-white/10 bg-gradient-to-br from-black to-primary/60"
          />
          <Button variant="ghost" size="sm" className="mt-2" onClick={draw}>
            Обновить предпросмотр
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
