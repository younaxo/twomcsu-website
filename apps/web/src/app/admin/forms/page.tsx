'use client';

import { FormStatus } from '@twomc/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { Skeleton } from '@/components/ui/skeleton';
import { extractErrorMessage } from '@/lib/api';
import {
  useAdminForms,
  useCloseForm,
  useCreateFromTemplate,
  useDeleteForm,
  useDuplicateForm,
  useFormTemplates,
  usePublishForm,
} from '@/hooks/forms';

const STATUS_LABELS: Record<FormStatus, string> = {
  [FormStatus.DRAFT]: 'Черновик',
  [FormStatus.PUBLISHED]: 'Опубликовано',
  [FormStatus.CLOSED]: 'Закрыта',
  [FormStatus.ARCHIVED]: 'Архив',
};

export default function AdminFormsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<FormStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const list = useAdminForms({
    page,
    limit: 20,
    ...(status !== 'ALL' ? { status } : {}),
    ...(search ? { search } : {}),
  });
  const templates = useFormTemplates(templatesOpen);
  const publish = usePublishForm();
  const close = useCloseForm();
  const duplicate = useDuplicateForm();
  const remove = useDeleteForm();
  const fromTemplate = useCreateFromTemplate();

  const runAction = async (action: Promise<unknown>, message: string) => {
    try {
      await action;
      toast.success(message);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">Формы</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setTemplatesOpen(true)}>
            Из шаблона
          </Button>
          <Button asChild>
            <Link href="/admin/forms/new">Создать форму</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['ALL', ...Object.keys(STATUS_LABELS)] as const).map((value) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={status === value ? 'default' : 'secondary'}
            onClick={() => {
              setStatus(value as FormStatus | 'ALL');
              setPage(1);
            }}
          >
            {value === 'ALL' ? 'Все' : STATUS_LABELS[value as FormStatus]}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Поиск..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl glass-medium">
        {list.isLoading ? (
          <div className="p-4">
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="p-3">Название</th>
                <th className="p-3">Статус</th>
                <th className="p-3">Ответы</th>
                <th className="p-3">Обновлено</th>
                <th className="p-3">Действия</th>
              </tr>
            </thead>
            <tbody>
              {list.data?.data.map((form) => (
                <tr key={form.id} className="border-b border-border/50">
                  <td className="p-3">
                    <div className="font-medium text-white">{form.title}</div>
                    <div className="text-xs text-muted-foreground">/{form.slug}</div>
                  </td>
                  <td className="p-3">{STATUS_LABELS[form.status]}</td>
                  <td className="p-3">{form.responsesCount}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(form.updatedAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/admin/forms/${form.id}/edit`}>Редактировать</Link>
                      </Button>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/admin/forms/${form.id}/responses`}>Ответы</Link>
                      </Button>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/admin/forms/${form.id}/stats`}>Статистика</Link>
                      </Button>
                      {form.status === FormStatus.DRAFT ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            void runAction(publish.mutateAsync(form.id), 'Опубликовано')
                          }
                        >
                          Опубликовать
                        </Button>
                      ) : null}
                      {form.status === FormStatus.PUBLISHED ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            void runAction(close.mutateAsync(form.id), 'Закрыто')
                          }
                        >
                          Закрыть
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          try {
                            const copy = await duplicate.mutateAsync(form.id);
                            toast.success('Дубликат создан');
                            router.push(`/admin/forms/${copy.id}/edit`);
                          } catch (error) {
                            toast.error(extractErrorMessage(error, 'Не удалось'));
                          }
                        }}
                      >
                        Дубликат
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void runAction(remove.mutateAsync(form.id), 'Удалено')
                        }
                      >
                        Удалить
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.data && !list.data.data.length ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    Форм не найдено
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        )}
      </div>

      {list.data && list.data.pagination.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            disabled={!list.data.pagination.hasPrev}
            onClick={() => setPage((p) => p - 1)}
          >
            Назад
          </Button>
          <span className="text-sm text-muted-foreground">
            {list.data.pagination.page} / {list.data.pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={!list.data.pagination.hasNext}
            onClick={() => setPage((p) => p + 1)}
          >
            Далее
          </Button>
        </div>
      ) : null}

      <Dialog open={templatesOpen} onOpenChange={setTemplatesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать из шаблона</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {templates.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : templates.data?.length ? (
              templates.data.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={async () => {
                    try {
                      const created = await fromTemplate.mutateAsync({ slug: template.slug });
                      toast.success('Форма создана');
                      setTemplatesOpen(false);
                      router.push(`/admin/forms/${created.id}/edit`);
                    } catch (error) {
                      toast.error(extractErrorMessage(error, 'Не удалось'));
                    }
                  }}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] p-3 text-left transition-colors hover:bg-white/10"
                >
                  <p className="text-sm font-semibold text-white">{template.title}</p>
                  {template.description ? (
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  ) : null}
                </button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Шаблонов пока нет</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setTemplatesOpen(false)}>
              Отмена
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
