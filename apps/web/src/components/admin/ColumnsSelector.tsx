'use client';

import { Columns3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface ColumnOption {
  id: string;
  label: string;
  required?: boolean;
}

interface ColumnsSelectorProps {
  columns: ColumnOption[];
  visibleIds: string[];
  onChange: (visibleIds: string[]) => void;
  className?: string;
  disabled?: boolean;
}

export function ColumnsSelector({
  columns,
  visibleIds,
  onChange,
  className,
  disabled,
}: ColumnsSelectorProps) {
  const toggle = (id: string, checked: boolean) => {
    const column = columns.find((c) => c.id === id);
    if (column?.required) return;

    if (checked) {
      onChange([...new Set([...visibleIds, id])]);
    } else {
      onChange(visibleIds.filter((item) => item !== id));
    }
  };

  const showAll = () => onChange(columns.map((c) => c.id));
  const hideOptional = () => onChange(columns.filter((c) => c.required).map((c) => c.id));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className={cn(className)}
          disabled={disabled}
        >
          <Columns3 className="mr-1.5 h-4 w-4" />
          Столбцы
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Видимые столбцы</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={visibleIds.includes(column.id)}
            disabled={column.required}
            onCheckedChange={(checked) => toggle(column.id, checked === true)}
            onSelect={(e) => e.preventDefault()}
          >
            {column.label}
            {column.required ? ' *' : ''}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked={false} onCheckedChange={showAll} onSelect={(e) => e.preventDefault()}>
          Показать все
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={false}
          onCheckedChange={hideOptional}
          onSelect={(e) => e.preventDefault()}
        >
          Только обязательные
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
