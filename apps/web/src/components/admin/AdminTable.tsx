'use client';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type SortDirection = 'asc' | 'desc';

export interface AdminTableColumn<T> {
  id: string;
  header: string;
  className?: string;
  sortable?: boolean;
  cell: (row: T) => React.ReactNode;
}

interface AdminTableProps<T> {
  columns: AdminTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  empty?: React.ReactNode;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  actions?: (row: T) => React.ReactNode;
  /** Multi-select */
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  /** Sorting */
  sortColumn?: string;
  sortDirection?: SortDirection;
  onSortChange?: (columnId: string, direction: SortDirection) => void;
  /** Per-page pagination */
  perPage?: number;
  perPageOptions?: number[];
  onPerPageChange?: (perPage: number) => void;
  totalItems?: number;
  skeletonRows?: number;
}

const DEFAULT_PER_PAGE_OPTIONS = [10, 25, 50, 100];

function TableSkeleton({
  columns,
  rows,
  selectable,
  hasActions,
}: {
  columns: number;
  rows: number;
  selectable?: boolean;
  hasActions?: boolean;
}) {
  const colCount = columns + (selectable ? 1 : 0) + (hasActions ? 1 : 0);

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: colCount }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: colCount }).map((__, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton className="h-4 w-full max-w-[120px]" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function AdminTable<T>({
  columns,
  data,
  rowKey,
  isLoading,
  empty,
  page = 1,
  totalPages = 1,
  onPageChange,
  actions,
  selectable,
  selectedIds = [],
  onSelectionChange,
  sortColumn,
  sortDirection = 'asc',
  onSortChange,
  perPage,
  perPageOptions = DEFAULT_PER_PAGE_OPTIONS,
  onPerPageChange,
  totalItems,
  skeletonRows = 8,
}: AdminTableProps<T>) {
  const visibleIds = data.map(rowKey);
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const someSelected = visibleIds.some((id) => selectedIds.includes(id));

  const toggleAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange([...new Set([...selectedIds, ...visibleIds])]);
    } else {
      onSelectionChange(selectedIds.filter((id) => !visibleIds.includes(id)));
    }
  };

  const toggleRow = (id: string, checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange([...new Set([...selectedIds, id])]);
    } else {
      onSelectionChange(selectedIds.filter((item) => item !== id));
    }
  };

  const handleSort = (columnId: string) => {
    if (!onSortChange) return;
    if (sortColumn === columnId) {
      onSortChange(columnId, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(columnId, 'asc');
    }
  };

  if (isLoading) {
    return (
      <TableSkeleton
        columns={columns.length}
        rows={skeletonRows}
        selectable={selectable}
        hasActions={Boolean(actions)}
      />
    );
  }

  if (data.length === 0) {
    return <>{empty}</>;
  }

  const showPagination = totalPages > 1 && onPageChange;
  const showPerPage = perPage !== undefined && onPerPageChange;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable ? (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={(checked) => toggleAll(checked === true)}
                    aria-label="Выбрать все на странице"
                  />
                </TableHead>
              ) : null}
              {columns.map((col) => (
                <TableHead key={col.id} className={col.className}>
                  {col.sortable && onSortChange ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-white"
                      onClick={() => handleSort(col.id)}
                    >
                      {col.header}
                      {sortColumn === col.id ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="h-3.5 w-3.5 text-[#F57C00]" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-[#F57C00]" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
              {actions ? <TableHead className="text-right">Действия</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => {
              const id = rowKey(row);
              const selected = selectedIds.includes(id);

              return (
                <TableRow
                  key={id}
                  className={cn('hover:bg-accent/30', selected && 'bg-accent/20')}
                >
                  {selectable ? (
                    <TableCell>
                      <Checkbox
                        checked={selected}
                        onCheckedChange={(checked) => toggleRow(id, checked === true)}
                        aria-label="Выбрать строку"
                      />
                    </TableCell>
                  ) : null}
                  {columns.map((col) => (
                    <TableCell key={col.id} className={cn(col.className)}>
                      {col.cell(row)}
                    </TableCell>
                  ))}
                  {actions ? (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">{actions(row)}</div>
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {(showPagination || showPerPage) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {typeof totalItems === 'number'
              ? `Всего: ${totalItems.toLocaleString('ru-RU')}`
              : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {showPerPage ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>На странице</span>
                <Select
                  value={String(perPage)}
                  onValueChange={(value) => onPerPageChange(Number(value))}
                >
                  <SelectTrigger className="h-8 w-[72px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {perPageOptions.map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {showPagination ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => onPageChange(page - 1)}
                >
                  Назад
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => onPageChange(page + 1)}
                >
                  Далее
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
