'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface AdminTableColumn<T> {
  id: string;
  header: string;
  className?: string;
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
}: AdminTableProps<T>) {
  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (data.length === 0) {
    return <>{empty}</>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.id} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
              {actions ? <TableHead className="text-right">Действия</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={rowKey(row)} className="hover:bg-accent/30">
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
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && onPageChange ? (
        <div className="flex items-center justify-center gap-2">
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
  );
}
