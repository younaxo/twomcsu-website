'use client';

import { BookmarkPlus, Trash2 } from 'lucide-react';
import { useState } from 'react';
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
import { cn } from '@/lib/utils';

export interface SavedFilter {
  id: string;
  name: string;
  page: string;
  filters: Record<string, unknown>;
  isDefault?: boolean;
}

interface SavedFiltersMenuProps {
  filters: SavedFilter[];
  value?: string;
  onSelect: (filter: SavedFilter) => void;
  onSave: (name: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
  disabled?: boolean;
}

export function SavedFiltersMenu({
  filters,
  value,
  onSelect,
  onSave,
  onDelete,
  className,
  disabled,
}: SavedFiltersMenuProps) {
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');

  const selected = filters.find((f) => f.id === value);

  const handleSave = () => {
    const trimmed = saveName.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setSaveName('');
    setSaveOpen(false);
  };

  return (
    <>
      <div className={cn('flex flex-wrap items-center gap-2', className)}>
        <Select
          value={value ?? ''}
          onValueChange={(id) => {
            const filter = filters.find((f) => f.id === id);
            if (filter) onSelect(filter);
          }}
          disabled={disabled || filters.length === 0}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Сохранённые фильтры" />
          </SelectTrigger>
          <SelectContent>
            {filters.map((filter) => (
              <SelectItem key={filter.id} value={filter.id}>
                {filter.name}
                {filter.isDefault ? ' (по умолчанию)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={() => setSaveOpen(true)}
        >
          <BookmarkPlus className="mr-1.5 h-4 w-4" />
          Сохранить
        </Button>

        {selected && onDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={disabled}
            onClick={() => onDelete(selected.id)}
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Удалить
          </Button>
        ) : null}
      </div>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сохранить фильтр</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="filter-name">Название</Label>
            <Input
              id="filter-name"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Например: Забаненные за неделю"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setSaveOpen(false)}>
              Отмена
            </Button>
            <Button type="button" onClick={handleSave} disabled={!saveName.trim()}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
