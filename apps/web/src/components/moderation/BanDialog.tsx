'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

interface BanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  allowPermanent?: boolean;
  allowIp?: boolean;
  onConfirm: (payload: {
    duration: number | null;
    reason: string;
    banType: 'ACCOUNT' | 'IP';
  }) => Promise<void>;
}

export function BanDialog({
  open,
  onOpenChange,
  username,
  allowPermanent,
  allowIp,
  onConfirm,
}: BanDialogProps) {
  const [duration, setDuration] = useState('24');
  const [banType, setBanType] = useState<'ACCOUNT' | 'IP'>('ACCOUNT');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-white/10">
        <DialogHeader>
          <DialogTitle>Забанить {username}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Тип</Label>
            <RadioGroup
              value={banType}
              onValueChange={(v) => setBanType(v as 'ACCOUNT' | 'IP')}
              className="gap-2"
            >
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="ACCOUNT" />
                Аккаунт
              </label>
              {allowIp ? (
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="IP" />
                  IP бан
                </label>
              ) : null}
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label>Длительность (часы)</Label>
            <RadioGroup value={duration} onValueChange={setDuration} className="gap-2">
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="1" />1 час
              </label>
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="24" />
                24 часа
              </label>
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="168" />7 дней
              </label>
              {allowPermanent ? (
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="forever" />
                  Навсегда
                </label>
              ) : null}
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label>Причина</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Обязательная причина"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            variant="destructive"
            disabled={busy || reason.trim().length < 2}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm({
                  duration: duration === 'forever' ? null : Number(duration),
                  reason: reason.trim(),
                  banType,
                });
                setReason('');
              } finally {
                setBusy(false);
              }
            }}
          >
            Забанить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
