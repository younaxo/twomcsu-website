'use client';

import type { FormResponseSummary } from '@twomc/shared';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Props {
  formId: string;
  responses: FormResponseSummary[];
  onDelete?: (responseId: string) => void;
  deleting?: boolean;
}

export function ResponsesTable({ formId, responses, onDelete, deleting }: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl glass-medium">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-border text-muted-foreground">
          <tr>
            <th className="p-3">Автор</th>
            <th className="p-3">Статус</th>
            <th className="p-3">Отправлено</th>
            <th className="p-3">Начато</th>
            <th className="p-3">Шаг</th>
            <th className="p-3">Действия</th>
          </tr>
        </thead>
        <tbody>
          {responses.map((response) => (
            <tr key={response.id} className="border-b border-border/50">
              <td className="p-3 text-white">
                {response.isAnonymous
                  ? '(аноним)'
                  : (response.respondentUsername ?? '—')}
              </td>
              <td className="p-3">
                {response.isComplete ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    Отправлен
                  </span>
                ) : (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-muted-foreground">
                    Черновик
                  </span>
                )}
              </td>
              <td className="p-3 text-xs text-muted-foreground">
                {response.completedAt
                  ? format(new Date(response.completedAt), 'yyyy-MM-dd HH:mm')
                  : '—'}
              </td>
              <td className="p-3 text-xs text-muted-foreground">
                {format(new Date(response.startedAt), 'yyyy-MM-dd HH:mm')}
              </td>
              <td className="p-3">{response.currentStep + 1}</td>
              <td className="p-3">
                <div className="flex gap-1">
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/admin/forms/${formId}/responses/${response.id}`}>
                      Открыть
                    </Link>
                  </Button>
                  {onDelete ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={deleting}
                      onClick={() => onDelete(response.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
          {!responses.length ? (
            <tr>
              <td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">
                Ответов пока нет
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
