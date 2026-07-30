'use client';

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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSetVerdict } from '@/hooks/reports/useReports';
import { extractErrorMessage } from '@/lib/api';

export function VerdictDialog({
  reportNumber,
  open,
  onOpenChange,
}: {
  reportNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const setVerdict = useSetVerdict();
  const [verdict, setVerdictText] = useState('');

  const submit = async () => {
    if (verdict.trim().length < 5) {
      toast.error('Вердикт слишком короткий');
      return;
    }
    try {
      await setVerdict.mutateAsync({ reportNumber, verdict: verdict.trim() });
      toast.success('Вердикт вынесен');
      onOpenChange(false);
      setVerdictText('');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось сохранить вердикт'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-white/10">
        <DialogHeader>
          <DialogTitle>Вынести вердикт</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Вердикт</Label>
          <Textarea
            value={verdict}
            onChange={(event) => setVerdictText(event.target.value)}
            rows={5}
            placeholder="Опишите решение по обращению..."
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            onClick={() => void submit()}
            disabled={setVerdict.isPending}
            className="bg-[#F57C00] text-black hover:bg-[#F57C00]/90"
          >
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
