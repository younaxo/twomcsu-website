'use client';

import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export type FilterSelectField = {
  type: 'select';
  id: string;
  label: string;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
};

export type FilterDateRangeField = {
  type: 'dateRange';
  id: string;
  label: string;
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
};

export type FilterBooleanField = {
  type: 'boolean';
  id: string;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

export type FilterField = FilterSelectField | FilterDateRangeField | FilterBooleanField;

interface FilterPanelProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  fields?: FilterField[];
  onReset?: () => void;
  onSave?: () => void;
  className?: string;
  extra?: React.ReactNode;
}

export function FilterPanel({
  search,
  onSearchChange,
  searchPlaceholder = 'Поиск…',
  fields = [],
  onReset,
  onSave,
  className,
  extra,
}: FilterPanelProps) {
  return (
    <div
      className={cn(
        'space-y-4 rounded-2xl glass-medium border border-white/5 p-4',
        className,
      )}
    >
      <div className="flex flex-wrap items-end gap-3">
        {onSearchChange !== undefined ? (
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder={searchPlaceholder}
              value={search ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        ) : null}

        {fields.map((field) => {
          if (field.type === 'select') {
            return (
              <div key={field.id} className="min-w-[160px] space-y-1.5">
                <Label className="text-xs text-muted-foreground">{field.label}</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder ?? 'Выберите…'} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          }

          if (field.type === 'dateRange') {
            return (
              <div key={field.id} className="flex flex-wrap items-end gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{field.label} с</Label>
                  <Input
                    type="date"
                    value={field.from}
                    onChange={(e) => field.onFromChange(e.target.value)}
                    className="w-[150px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">по</Label>
                  <Input
                    type="date"
                    value={field.to}
                    onChange={(e) => field.onToChange(e.target.value)}
                    className="w-[150px]"
                  />
                </div>
              </div>
            );
          }

          return (
            <div
              key={field.id}
              className="flex min-w-[160px] items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
            >
              <Label htmlFor={field.id} className="text-sm">
                {field.label}
              </Label>
              <Switch
                id={field.id}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </div>
          );
        })}

        {extra}
      </div>

      {onReset || onSave ? (
        <div className="flex flex-wrap gap-2 border-t border-white/5 pt-3">
          {onReset ? (
            <Button type="button" variant="secondary" size="sm" onClick={onReset}>
              <X className="mr-1.5 h-4 w-4" />
              Сбросить
            </Button>
          ) : null}
          {onSave ? (
            <Button type="button" variant="outline" size="sm" onClick={onSave}>
              Сохранить фильтр
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
