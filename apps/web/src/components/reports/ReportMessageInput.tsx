'use client';

import { Paperclip } from 'lucide-react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileUploadZone } from '@/components/reports/FileUploadZone';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAddReportMessage } from '@/hooks/reports/useReports';
import { api, extractErrorMessage } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

const MAX_MESSAGE_FILES = 5;

export function ReportMessageInput({
  reportNumber,
  isLocked,
}: {
  reportNumber: string;
  isLocked: boolean;
}) {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [showFiles, setShowFiles] = useState(false);
  const [sending, setSending] = useState(false);
  const addMessage = useAddReportMessage(reportNumber);
  const qc = useQueryClient();

  const submit = async () => {
    if (!content.trim()) return;
    setSending(true);
    try {
      const report = await addMessage.mutateAsync({ content: content.trim() });
      const message = [...report.messages].reverse().find((item) => !item.isSystem);

      if (message && files.length > 0) {
        for (const file of files) {
          const form = new FormData();
          form.append('file', file);
          await api.post(
            `/reports/${reportNumber}/messages/${message.id}/attachments`,
            form,
            { headers: { 'Content-Type': 'multipart/form-data' } },
          );
        }
        await qc.invalidateQueries({ queryKey: queryKeys.report(reportNumber) });
      }

      setContent('');
      setFiles([]);
      setShowFiles(false);
      toast.success('Сообщение отправлено');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось отправить сообщение'));
    } finally {
      setSending(false);
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

      {showFiles ? (
        <FileUploadZone
          files={files}
          onChange={setFiles}
          maxFiles={MAX_MESSAGE_FILES}
          hint="До 5 файлов · jpg, png, webp, pdf, mp4, doc, txt"
        />
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setShowFiles((value) => !value)}
          className="text-muted-foreground"
        >
          <Paperclip className="mr-1 h-4 w-4" />
          {showFiles ? 'Скрыть файлы' : 'Прикрепить'}
          {files.length > 0 ? ` (${files.length})` : ''}
        </Button>
        <Button
          type="button"
          onClick={() => void submit()}
          disabled={sending || addMessage.isPending || content.trim().length < 1}
          className="bg-[#F57C00] text-black hover:bg-[#E65100]"
        >
          Отправить
        </Button>
      </div>
    </div>
  );
}
