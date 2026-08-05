'use client';

import { ProfileReportReason } from '@twomc/shared';
import { Flag } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api, extractErrorMessage } from '@/lib/api';
import { profileReportLabels } from '@/lib/profile';

interface ReportProfileDialogProps {
  username: string;
}

export function ReportProfileDialog({ username }: ReportProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ProfileReportReason | ''>('');
  const [description, setDescription] = useState('');
  const [isBusy, setBusy] = useState(false);

  const submit = async () => {
    if (!reason) {
      toast.error('Выберите причину');
      return;
    }

    setBusy(true);
    try {
      await api.post(`/users/${encodeURIComponent(username)}/report`, {
        reason,
        description: description.trim() || undefined,
      });
      toast.success('Жалоба отправлена');
      setOpen(false);
      setReason('');
      setDescription('');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось отправить жалобу'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm">
          <Flag className="h-4 w-4" />
          Пожаловаться
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Пожаловаться на профиль</DialogTitle>
          <DialogDescription>
            Расскажите, что не так с профилем {username}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Причина</Label>
            <Select value={reason} onValueChange={(value) => setReason(value as ProfileReportReason)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите причину" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(profileReportLabels) as ProfileReportReason[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {profileReportLabels[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Описание</Label>
            <Textarea
              value={description}
              maxLength={500}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Подробности (необязательно)"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => void submit()} disabled={isBusy || !reason}>
            {isBusy ? 'Отправляем...' : 'Отправить жалобу'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
