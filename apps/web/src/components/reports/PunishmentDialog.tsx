'use client';

import { PunishmentType, PUNISHMENT_TYPE_LABELS } from '@twomc/shared';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { usePunishReport } from '@/hooks/reports/useReports';
import { extractErrorMessage } from '@/lib/api';

export function PunishmentDialog({
  reportNumber,
  open,
  onOpenChange,
}: {
  reportNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const punish = usePunishReport();
  const [punishmentType, setPunishmentType] = useState<PunishmentType>(PunishmentType.WARN);
  const [duration, setDuration] = useState('');
  const [reason, setReason] = useState('');

  const submit = async () => {
    if (reason.trim().length < 3) {
      toast.error('Укажите причину');
      return;
    }
    try {
      await punish.mutateAsync({
        reportNumber,
        punishmentType,
        duration: duration.trim() || undefined,
        reason: reason.trim(),
      });
      toast.success('Наказание выдано');
      onOpenChange(false);
      setReason('');
      setDuration('');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось выдать наказание'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-white/10">
        <DialogHeader>
          <DialogTitle>Выдать наказание</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Тип</Label>
            <Select
              value={punishmentType}
              onValueChange={(value) => setPunishmentType(value as PunishmentType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PUNISHMENT_TYPE_LABELS) as PunishmentType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {PUNISHMENT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Длительность</Label>
            <Input
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              placeholder="Например: 7d, 1h"
            />
          </div>
          <div className="space-y-2">
            <Label>Причина</Label>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            onClick={() => void submit()}
            disabled={punish.isPending}
            className="bg-[#F57C00] text-black hover:bg-[#F57C00]/90"
          >
            Выдать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
