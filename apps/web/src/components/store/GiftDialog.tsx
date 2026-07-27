'use client';

import type { UserProfile } from '@twomc/shared';
import { useState } from 'react';
import { toast } from 'sonner';
import { useDebounce } from 'use-debounce';
import { useEffect } from 'react';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { SkinHead } from '@/components/shared/SkinHead';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api, extractErrorMessage } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/profile';

interface GiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: { giftToUserId: string; giftMessage: string }) => Promise<void>;
  title?: string;
}

export function GiftDialog({
  open,
  onOpenChange,
  onConfirm,
  title = 'Подарить',
}: GiftDialogProps) {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [debounced] = useDebounce(username.trim(), 300);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [looking, setLooking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setUsername('');
      setMessage('');
      setProfile(null);
    }
  }, [open]);

  useEffect(() => {
    if (!debounced || debounced.length < 2) {
      setProfile(null);
      return;
    }

    let cancelled = false;
    setLooking(true);

    void api
      .get<UserProfile>(`/users/${encodeURIComponent(debounced)}/public`, {
        skipAuthRedirect: true,
      })
      .then(({ data }) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setLooking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const submit = async () => {
    if (!profile) {
      toast.error('Укажите существующего игрока');
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm({
        giftToUserId: profile.id,
        giftMessage: message.trim().slice(0, 500),
      });
      onOpenChange(false);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось оформить подарок'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Укажите никнейм получателя и при желании добавьте сообщение
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gift-username">Получатель</Label>
            <Input
              id="gift-username"
              placeholder="Никнейм"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
            />
            {looking ? (
              <p className="text-xs text-muted-foreground">Поиск…</p>
            ) : profile ? (
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                <SkinHead
                  username={profile.username}
                  minecraftNick={profile.minecraftNick}
                  avatar={resolveMediaUrl(profile.avatar) ?? null}
                  size={32}
                />
                <ColoredUsername user={profile} size="sm" linkToProfile={false} />
              </div>
            ) : debounced.length >= 2 ? (
              <p className="text-xs text-destructive">Игрок не найден</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gift-message">Сообщение</Label>
            <Textarea
              id="gift-message"
              placeholder="С днём рождения!"
              maxLength={500}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
            <p className="text-right text-xs text-muted-foreground">{message.length}/500</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button disabled={!profile || submitting} onClick={() => void submit()}>
            Подарить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
