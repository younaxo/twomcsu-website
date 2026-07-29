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

const DURATIONS = [
  { value: '5', label: '5 минут', minutes: 5 },
  { value: '15', label: '15 минут', minutes: 15 },
  { value: '60', label: '1 час', minutes: 60 },
  { value: '1440', label: '24 часа', minutes: 1440 },
  { value: 'forever', label: 'Навсегда', minutes: null },
] as const;

interface MuteDurationSelectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  onConfirm: (payload: { duration: number | null; reason: string }) => Promise<void>;
}

export function MuteDurationSelect({
  open,
  onOpenChange,
  username,
  onConfirm,
}: MuteDurationSelectProps) {
  const [duration, setDuration] = useState('15');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-white/10">
        <DialogHeader>
          <DialogTitle>Замутить {username}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Длительность</Label>
            <RadioGroup value={duration} onValueChange={setDuration} className="gap-2">
              {DURATIONS.map((item) => (
                <label key={item.value} className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value={item.value} />
                  {item.label}
                </label>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label>Причина</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Обязательно укажите причину"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            disabled={busy || reason.trim().length < 2}
            onClick={async () => {
              setBusy(true);
              try {
                const selected = DURATIONS.find((d) => d.value === duration);
                await onConfirm({
                  duration: selected?.minutes ?? null,
                  reason: reason.trim(),
                });
                setReason('');
              } finally {
                setBusy(false);
              }
            }}
          >
            Замутить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
