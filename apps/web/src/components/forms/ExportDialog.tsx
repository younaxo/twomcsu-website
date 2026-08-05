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
import { Input } from '@/components/ui/input';
import { extractErrorMessage } from '@/lib/api';
import { useExportForm, type FormExportFormat } from '@/hooks/forms';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: string;
}

const FORMATS: Array<{ value: FormExportFormat; label: string }> = [
  { value: 'csv', label: 'CSV' },
  { value: 'excel', label: 'Excel' },
  { value: 'pdf', label: 'PDF' },
];

export function ExportDialog({ open, onOpenChange, formId }: Props) {
  const [format, setFormat] = useState<FormExportFormat>('csv');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [completeOnly, setCompleteOnly] = useState(true);
  const exporter = useExportForm(formId);

  const run = async () => {
    try {
      const result = await exporter.mutateAsync({
        format,
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to).toISOString() : undefined,
        completeOnly,
      });
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(url);
      onOpenChange(false);
      toast.success('Экспорт готов');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось экспортировать'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Экспорт ответов</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Формат</label>
            <div className="mt-1 flex gap-1">
              {FORMATS.map((entry) => (
                <Button
                  key={entry.value}
                  type="button"
                  size="sm"
                  variant={format === entry.value ? 'default' : 'secondary'}
                  onClick={() => setFormat(entry.value)}
                >
                  {entry.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">С</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">По</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={completeOnly}
              onChange={(e) => setCompleteOnly(e.target.checked)}
            />
            Только завершённые
          </label>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={() => void run()} disabled={exporter.isPending}>
            {exporter.isPending ? 'Готовим...' : 'Скачать'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
