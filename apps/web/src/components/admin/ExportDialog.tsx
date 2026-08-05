'use client';

import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

export type ExportFormat = 'csv' | 'excel' | 'pdf';

export interface ExportColumn {
  id: string;
  label: string;
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ExportColumn[];
  onExport: (options: {
    format: ExportFormat;
    columnIds: string[];
  }) => void | Promise<void>;
  isExporting?: boolean;
  title?: string;
  description?: string;
}

const FORMAT_LABELS: Record<ExportFormat, string> = {
  csv: 'CSV',
  excel: 'Excel (.xlsx)',
  pdf: 'PDF',
};

export function ExportDialog({
  open,
  onOpenChange,
  columns,
  onExport,
  isExporting,
  title = 'Экспорт данных',
  description = 'Выберите формат и столбцы для экспорта',
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [selected, setSelected] = useState<string[]>(() => columns.map((c) => c.id));

  const allSelected = useMemo(
    () => columns.length > 0 && selected.length === columns.length,
    [columns.length, selected.length],
  );

  const toggleColumn = (id: string, checked: boolean) => {
    setSelected((prev) =>
      checked ? [...new Set([...prev, id])] : prev.filter((item) => item !== id),
    );
  };

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? columns.map((c) => c.id) : []);
  };

  const handleExport = async () => {
    if (selected.length === 0) return;
    await onExport({ format, columnIds: selected });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Формат</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(FORMAT_LABELS) as ExportFormat[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {FORMAT_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Столбцы</Label>
              <button
                type="button"
                className="text-xs text-[#F57C00] hover:underline"
                onClick={() => toggleAll(!allSelected)}
              >
                {allSelected ? 'Снять все' : 'Выбрать все'}
              </button>
            </div>
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-white/10 p-3">
              {columns.map((column) => (
                <label
                  key={column.id}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <Checkbox
                    checked={selected.includes(column.id)}
                    onCheckedChange={(checked) => toggleColumn(column.id, checked === true)}
                  />
                  <span>{column.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting || selected.length === 0}
          >
            <Download className="mr-1.5 h-4 w-4" />
            {isExporting ? 'Экспорт…' : 'Экспортировать'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
