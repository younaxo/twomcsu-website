'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAddReportMessage } from '@/hooks/reports/useReports';
import { extractErrorMessage } from '@/lib/api';

export function ReportMessageInput({
  reportNumber,
  isLocked,
}: {
  reportNumber: string;
  isLocked: boolean;
}) {
  const [content, setContent] = useState('');
  const addMessage = useAddReportMessage(reportNumber);

  const submit = async () => {
    if (!content.trim()) return;
    try {
      await addMessage.mutateAsync({ content: content.trim() });
      setContent('');
      toast.success('Сообщение отправлено');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось отправить сообщение'));
    }
  };

  if (isLocked) {
    return (
      <p className="rounded-xl glass-medium px-4 py-3 text-sm text-muted-foreground">
        Обращение заблокировано для новых сообщений
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-xl glass-medium p-4">
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Напишите ответ (поддерживается markdown)..."
        rows={3}
        className="min-h-[80px] resize-y bg-transparent"
      />
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => void submit()}
          disabled={addMessage.isPending || content.trim().length < 1}
          className="bg-[#F57C00] text-black hover:bg-[#E65100]"
        >
          Отправить
        </Button>
      </div>
    </div>
  );
}
