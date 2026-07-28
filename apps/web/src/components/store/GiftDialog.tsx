'use client';

import type { UserSearchResult } from '@twomc/shared';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { SkinHead } from '@/components/shared/SkinHead';
import { UserSearchInput } from '@/components/shared/UserSearchInput';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { extractErrorMessage } from '@/lib/api';
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
  const [recipient, setRecipient] = useState<UserSearchResult | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setRecipient(null);
      setMessage('');
    }
  }, [open]);

  const submit = async () => {
    if (!recipient) {
      toast.error('Укажите существующего игрока');
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm({
        giftToUserId: recipient.id,
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
            Укажите получателя и при желании добавьте сообщение
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gift-recipient">Получатель</Label>

            {recipient ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <SkinHead
                    username={recipient.username}
                    avatar={resolveMediaUrl(recipient.avatar) ?? null}
                    size={32}
                  />
                  <ColoredUsername user={recipient} size="sm" linkToProfile={false} />
                  <span className="text-xs text-muted-foreground">#{recipient.shortId}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setRecipient(null)}>
                  Сменить
                </Button>
              </div>
            ) : (
              <UserSearchInput
                id="gift-recipient"
                placeholder="Никнейм, email, #123 или tag"
                onSelect={setRecipient}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gift-message">Сообщение</Label>
            <Textarea
              id="gift-message"
              placeholder="С днём рождения!"
              maxLength={500}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={3}
            />
            <p className="text-right text-xs text-muted-foreground">{message.length}/500</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button disabled={!recipient || submitting} onClick={() => void submit()}>
            Подарить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
