'use client';

import { MAX_COMMENT_LENGTH } from '@twomc/shared';
import { Bold, Code, Italic, Link2, List, Quote, Strikethrough } from 'lucide-react';
import { useMemo, useState } from 'react';
import { MentionsInput, Mention } from 'react-mentions';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { api, extractErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

interface MentionSuggestion {
  id: string;
  display: string;
}

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
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);

  const length = value.length;
  const overLimit = length > MAX_COMMENT_LENGTH;

  const wrapSelection = (before: string, after = before) => {
    setValue((current) => `${current}${before}${after}`);
  };

  const fetchMentions = (
    query: string,
    callback: (data: MentionSuggestion[]) => void,
  ) => {
    if (!query.trim()) {
      callback([]);
      return;
    }

    void api
      .get<{ data: { id: string; username: string }[] }>('/friends', {
        params: { page: 1, limit: 8, search: query },
        skipAuthRedirect: true,
      })
      .then(({ data }) => {
        callback(
          (data.data ?? []).slice(0, 8).map((user) => ({
            id: user.username,
            display: user.username,
          })),
        );
      })
      .catch(() => callback([]));
  };

  const previewHtml = useMemo(() => value, [value]);

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
      setPreview(false);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось отправить комментарий'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-3">
      <div className="flex flex-wrap gap-1">
        <ToolbarButton label="Жирный" onClick={() => wrapSelection('**')}>
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Курсив" onClick={() => wrapSelection('*')}>
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Зачёркнутый" onClick={() => wrapSelection('~~')}>
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Код" onClick={() => wrapSelection('`')}>
          <Code className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Цитата" onClick={() => wrapSelection('> ', '')}>
          <Quote className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Спойлер" onClick={() => wrapSelection('||')}>
          <span className="text-[10px] font-semibold">||</span>
        </ToolbarButton>
        <ToolbarButton label="Ссылка" onClick={() => wrapSelection('[текст](', ')')}>
          <Link2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Список" onClick={() => wrapSelection('- ', '')}>
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="ml-auto h-8"
          onClick={() => setPreview((value) => !value)}
        >
          {preview ? 'Редактор' : 'Превью'}
        </Button>
      </div>

      {preview ? (
        <div className="comment-markdown min-h-[96px] rounded-lg border border-border bg-secondary/30 p-3 text-sm">
          {previewHtml.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
              {previewHtml}
            </ReactMarkdown>
          ) : (
            <p className="text-muted-foreground">Нечего показывать</p>
          )}
        </div>
      ) : (
        <MentionsInput
          value={value}
          onChange={(_event, newValue) => setValue(newValue)}
          placeholder={placeholder}
          className="mentions"
          style={mentionsStyle}
          a11ySuggestionsListLabel="Упоминания"
        >
          <Mention
            trigger="@"
            data={fetchMentions}
            markup="@__id__"
            displayTransform={(id) => `@${id}`}
            appendSpaceOnAdd
            renderSuggestion={(suggestion, _search, highlighted) => (
              <div className="px-2 py-1.5 text-sm">@{highlighted || suggestion.display}</div>
            )}
          />
        </MentionsInput>
      )}

      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            'text-xs tabular-nums',
            overLimit ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {length}/{MAX_COMMENT_LENGTH}
        </span>
        <div className="flex gap-2">
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
    </div>
  );
}

function ToolbarButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className="h-8 w-8"
      title={label}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

const mentionsStyle = {
  control: {
    backgroundColor: 'transparent',
    fontSize: 14,
    minHeight: 96,
  },
  highlighter: {
    padding: 12,
    border: '1px solid transparent',
  },
  input: {
    padding: 12,
    border: '1px solid hsl(var(--border))',
    borderRadius: 8,
    outline: 'none',
    color: 'hsl(var(--foreground))',
  },
  suggestions: {
    list: {
      backgroundColor: 'hsl(var(--popover))',
      border: '1px solid hsl(var(--border))',
      borderRadius: 8,
      fontSize: 14,
      overflow: 'hidden',
    },
    item: {
      padding: '6px 10px',
      borderBottom: '1px solid hsl(var(--border))',
      '&focused': {
        backgroundColor: 'hsl(var(--accent))',
      },
    },
  },
};
