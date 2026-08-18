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
import { Textarea } from '@/components/ui/textarea';

const PRESETS = ['Спам', 'Оскорбления', 'Реклама', 'Другое'];

interface WarnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  onConfirm: (reason: string) => Promise<void>;
}

export function WarnDialog({ open, onOpenChange, username, onConfirm }: WarnDialogProps) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-white/10">
        <DialogHeader>
          <DialogTitle>Предупредить {username}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <Button
                key={preset}
                type="button"
                size="sm"
                variant="secondary"
                className="glass-hover-orange"
                onClick={() => setReason(preset === 'Другое' ? '' : preset)}
              >
                {preset}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <Label>Причина</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Опишите причину предупреждения"
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
                await onConfirm(reason.trim());
                setReason('');
              } finally {
                setBusy(false);
              }
            }}
          >
            Предупредить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
