'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCreateNewsComment } from '@/hooks/news';
import { useAuth } from '@/hooks/useAuth';

interface NewsCommentFormProps {
  slug: string;
  parentId?: string;
  initialValue?: string;
  placeholder?: string;
  submitLabel?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
  onSubmit?: (content: string) => Promise<void>;
}

export function NewsCommentForm({
  slug,
  parentId,
  initialValue = '',
  placeholder = 'Напишите комментарий...',
  submitLabel = 'Отправить',
  onCancel,
  onSuccess,
  onSubmit,
}: NewsCommentFormProps) {
  const { user } = useAuth();
  const create = useCreateNewsComment(slug);
  const [content, setContent] = useState(initialValue);
  const [pending, setPending] = useState(false);

  if (!user) {
    return (
      <p className="rounded-xl glass-light p-4 text-sm text-muted-foreground">
        Войдите, чтобы оставить комментарий.
      </p>
    );
  }

  const submit = async () => {
    const trimmed = content.trim();
    if (trimmed.length < 3) {
      toast.error('Минимум 3 символа');
      return;
    }

    setPending(true);
    try {
      if (onSubmit) {
        await onSubmit(trimmed);
      } else {
        await create.mutateAsync({ content: trimmed, parentId });
        setContent('');
        toast.success('Комментарий отправлен');
      }
      onSuccess?.();
    } catch {
      toast.error('Не удалось отправить комментарий');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl glass-light p-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={4}
        maxLength={2000}
      />
      <div className="flex items-center justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Отмена
          </Button>
        ) : null}
        <Button type="button" onClick={submit} disabled={pending || create.isPending}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
