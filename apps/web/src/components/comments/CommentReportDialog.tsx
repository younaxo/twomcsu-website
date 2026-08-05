'use client';

import { CommentReportReason } from '@twomc/shared';
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
import { useReportComment } from '@/hooks/useProfileComments';
import { extractErrorMessage } from '@/lib/api';

const reasonLabels: Record<CommentReportReason, string> = {
  SPAM: 'Спам',
  INAPPROPRIATE: 'Неприемлемый контент',
  HARASSMENT: 'Оскорбления',
  IMPERSONATION: 'Выдаёт себя за другого',
  OTHER: 'Другое',
};

interface CommentReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  commentId: string;
}

export function CommentReportDialog({
  open,
  onOpenChange,
  username,
  commentId,
}: CommentReportDialogProps) {
  const [reason, setReason] = useState<CommentReportReason | ''>('');
  const [description, setDescription] = useState('');
  const report = useReportComment(username, commentId);

  const submit = async () => {
    if (!reason) {
      toast.error('Выберите причину');
      return;
    }

    try {
      await report.mutateAsync({
        reason,
        description: description.trim() || undefined,
      });
      toast.success('Жалоба отправлена');
      onOpenChange(false);
      setReason('');
      setDescription('');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось отправить жалобу'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Пожаловаться на комментарий</DialogTitle>
          <DialogDescription>Опишите проблему — модерация разберётся</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Причина</Label>
            <Select
              value={reason}
              onValueChange={(value) => setReason(value as CommentReportReason)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите причину" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(reasonLabels) as CommentReportReason[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {reasonLabels[key]}
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
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={report.isPending || !reason}
          >
            {report.isPending ? 'Отправляем...' : 'Отправить жалобу'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
