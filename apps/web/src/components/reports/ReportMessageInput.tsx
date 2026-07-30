'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAddReportMessage } from '@/hooks/reports/useReports';
import { extractErrorMessage } from '@/lib/api';

export function ReportMessageInput({
  reportNumber,
  isLocked,
  canInternal,
}: {
  reportNumber: string;
  isLocked: boolean;
  canInternal?: boolean;
}) {
  const [content, setContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const addMessage = useAddReportMessage(reportNumber);

  const submit = async () => {
    if (!content.trim()) return;
    try {
      await addMessage.mutateAsync({
        content: content.trim(),
        isInternal: canInternal ? isInternal : false,
      });
      setContent('');
      setIsInternal(false);
      toast.success('Сообщение отправлено');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось отправить сообщение'));
    }
  };

  if (isLocked) {
    return (
      <p className="rounded-xl glass-medium px-4 py-3 text-sm text-muted-foreground">
        Обращение заблокировано. Новые сообщения недоступны.
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-xl glass-medium p-4">
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Напишите ответ..."
        rows={3}
        className="min-h-[80px] resize-y bg-transparent"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        {canInternal ? (
          <div className="flex items-center gap-2">
            <Checkbox
              id="internal-note"
              checked={isInternal}
              onCheckedChange={(value) => setIsInternal(value === true)}
            />
            <Label htmlFor="internal-note" className="cursor-pointer text-sm">
              Внутренняя заметка
            </Label>
          </div>
        ) : (
          <span />
        )}
        <Button
          type="button"
          onClick={() => void submit()}
          disabled={addMessage.isPending || content.trim().length < 1}
          className="bg-[#F57C00] text-black hover:bg-[#F57C00]/90"
        >
          Отправить
        </Button>
      </div>
    </div>
  );
}
