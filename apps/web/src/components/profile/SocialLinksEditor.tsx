'use client';

import {
  SocialPlatform,
  SocialLink,
  socialPlatformOrder,
} from '@twomc/shared';
import {
  Gamepad2,
  MessageCircle,
  Send,
  Tv,
  Video,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { api, extractErrorMessage } from '@/lib/api';
import { socialPlatformLabels } from '@/lib/profile';

const icons: Record<SocialPlatform, ReactNode> = {
  DISCORD: <MessageCircle className="h-4 w-4" />,
  TELEGRAM: <Send className="h-4 w-4" />,
  VK: <MessageCircle className="h-4 w-4" />,
  YOUTUBE: <Video className="h-4 w-4" />,
  TWITCH: <Tv className="h-4 w-4" />,
  TIKTOK: <Gamepad2 className="h-4 w-4" />,
  STEAM: <Gamepad2 className="h-4 w-4" />,
};

interface SocialLinksEditorProps {
  value: SocialLink[];
  onChange: (links: SocialLink[]) => void;
}

export function SocialLinksEditor({ value, onChange }: SocialLinksEditorProps) {
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(value.map((link) => [link.platform, link.value])),
  );
  const [busy, setBusy] = useState<string | null>(null);

  const save = async (platform: SocialPlatform) => {
    const next = (drafts[platform] ?? '').trim();
    setBusy(platform);

    try {
      if (!next) {
        await api.delete(`/users/me/socials/${platform}`);
        onChange(value.filter((link) => link.platform !== platform));
        toast.success('Ссылка удалена');
      } else {
        const { data } = await api.put<SocialLink>(`/users/me/socials/${platform}`, {
          value: next,
        });
        const rest = value.filter((link) => link.platform !== platform);
        onChange([...rest, data]);
        toast.success('Сохранено');
      }
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось сохранить ссылку'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      {socialPlatformOrder.map((platform) => (
        <div key={platform} className="space-y-2">
          <Label className="flex items-center gap-2">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>{icons[platform]}</span>
                </TooltipTrigger>
                <TooltipContent>{socialPlatformLabels[platform]}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {socialPlatformLabels[platform]}
          </Label>
          <div className="flex gap-2">
            <Input
              value={drafts[platform] ?? ''}
              onChange={(event) =>
                setDrafts((prev) => ({ ...prev, [platform]: event.target.value }))
              }
              placeholder={
                platform === 'DISCORD' || platform === 'TELEGRAM' ? 'username' : 'https://...'
              }
            />
            <Button
              type="button"
              variant="secondary"
              disabled={busy === platform}
              onClick={() => void save(platform)}
            >
              Сохранить
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
