'use client';

import { MAX_COMMENT_LENGTH } from '@twomc/shared';
import { useState } from 'react';
import { toast } from 'sonner';
import { MarkdownEditor } from '@/components/shared/MarkdownEditor';
import { Button } from '@/components/ui/button';
import { extractErrorMessage } from '@/lib/api';

interface CommentEditorProps {
  placeholder?: string;
  submitLabel?: string;
  initialValue?: string;
  isSubmitting?: boolean;
  onSubmit: (content: string) => Promise<void> | void;
  onCancel?: () => void;
}

export function CommentEditor({
  placeholder = 'Написать комментарий...',
  submitLabel = 'Отправить',
  initialValue = '',
  isSubmitting,
  onSubmit,
  onCancel,
}: CommentEditorProps) {
  const [value, setValue] = useState(initialValue);
  const [busy, setBusy] = useState(false);

  const overLimit = value.length > MAX_COMMENT_LENGTH;

  const submit = async () => {
    const content = value.trim();
    if (!content) {
      toast.error('Комментарий не может быть пустым');
      return;
    }
    if (overLimit) {
      toast.error(`Максимум ${MAX_COMMENT_LENGTH} символов`);
      return;
    }

    setBusy(true);
    try {
      await onSubmit(content);
      setValue('');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось отправить комментарий'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <MarkdownEditor
        value={value}
        onChange={setValue}
        placeholder={placeholder}
        minHeight={120}
        maxHeight={400}
        maxLength={MAX_COMMENT_LENGTH}
        disabled={busy || isSubmitting}
      />
      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Отмена
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          disabled={busy || isSubmitting || overLimit || !value.trim()}
          onClick={() => void submit()}
        >
          {busy || isSubmitting ? 'Отправляем...' : submitLabel}
        </Button>
      </div>
    </div>
  );
}
