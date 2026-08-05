'use client';

import type { MentionSearchResult, UserBadgeType } from '@twomc/shared';
import {
  Bold,
  Code,
  Eye,
  EyeOff,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  AtSign,
  SquareCode,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { EmojiPickerButton } from '@/components/shared/EmojiPicker';
import { MarkdownContent } from '@/components/shared/MarkdownContent';
import { SkinHead } from '@/components/shared/SkinHead';
import { UserBadgeIcon } from '@/components/shared/UserBadgeIcon';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useEmojiSearch, useMentionSearch, type EmojiSearchItem } from '@/hooks/markdown';
import {
  getActiveTrigger,
  insertAtCursor,
  wrapSelection,
} from '@/lib/markdown-utils';
import { cn } from '@/lib/utils';

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  showToolbar?: boolean;
  showPreview?: boolean;
  mentionsEnabled?: boolean;
  emojiEnabled?: boolean;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
}

type AutocompleteState =
  | { type: 'mention'; query: string; start: number }
  | { type: 'emoji'; query: string; start: number }
  | null;

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Написать сообщение...',
  minHeight = 150,
  maxHeight = 500,
  showToolbar = true,
  showPreview = false,
  mentionsEnabled = true,
  emojiEnabled = true,
  maxLength,
  disabled = false,
  className,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(showPreview);
  const [autocomplete, setAutocomplete] = useState<AutocompleteState>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const editorId = useId();

  const mentionQuery = autocomplete?.type === 'mention' ? autocomplete.query : '';
  const emojiQuery = autocomplete?.type === 'emoji' ? autocomplete.query : '';

  const { data: mentionResults = [] } = useMentionSearch(
    mentionQuery,
    mentionsEnabled && autocomplete?.type === 'mention' && mentionQuery.length >= 1,
  );
  const { results: emojiResults } = useEmojiSearch(
    emojiQuery,
    emojiEnabled && autocomplete?.type === 'emoji' && emojiQuery.length >= 2,
  );

  const suggestions =
    autocomplete?.type === 'mention'
      ? mentionResults
      : autocomplete?.type === 'emoji'
        ? emojiResults
        : [];

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight);
    el.style.height = `${next}px`;
  }, [maxHeight, minHeight]);

  useEffect(() => {
    resize();
  }, [value, resize]);

  const applyEdit = (next: { value: string; selectionStart: number; selectionEnd: number }) => {
    if (maxLength !== undefined && next.value.length > maxLength) return;
    onChange(next.value);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(next.selectionStart, next.selectionEnd);
      resize();
      syncAutocomplete(next.value, next.selectionStart);
    });
  };

  const syncAutocomplete = (text: string, caret: number) => {
    if ((!mentionsEnabled && !emojiEnabled) || disabled) {
      setAutocomplete(null);
      return;
    }
    const trigger = getActiveTrigger(text, caret);
    if (!trigger) {
      setAutocomplete(null);
      return;
    }
    if (trigger.type === 'mention' && !mentionsEnabled) {
      setAutocomplete(null);
      return;
    }
    if (trigger.type === 'emoji' && !emojiEnabled) {
      setAutocomplete(null);
      return;
    }
    if (trigger.type === 'emoji' && trigger.query.length < 2) {
      setAutocomplete(null);
      return;
    }
    if (trigger.type === 'mention' && trigger.query.length < 1) {
      setAutocomplete({ type: 'mention', query: '', start: trigger.start });
      setActiveIndex(0);
      return;
    }
    setAutocomplete(trigger);
    setActiveIndex(0);
  };

  const runWrap = (before: string, after = before) => {
    const el = textareaRef.current;
    if (!el) return;
    applyEdit(wrapSelection(value, el.selectionStart, el.selectionEnd, before, after));
  };

  const runInsert = (text: string) => {
    const el = textareaRef.current;
    if (!el) return;
    applyEdit(insertAtCursor(value, el.selectionStart, el.selectionEnd, text));
  };

  const insertLink = () => {
    const el = textareaRef.current;
    if (!el) return;
    const selected = value.slice(el.selectionStart, el.selectionEnd) || 'текст';
    const wrapped = wrapSelection(value, el.selectionStart, el.selectionEnd, '[', `](url)`);
    // Prefer wrapping selection as link text
    applyEdit(
      wrapSelection(
        value,
        el.selectionStart,
        el.selectionEnd,
        '[',
        '](https://)',
      ),
    );
    void selected;
    void wrapped;
  };

  const selectMention = (user: MentionSearchResult) => {
    if (!autocomplete || autocomplete.type !== 'mention') return;
    const el = textareaRef.current;
    const caret = el?.selectionStart ?? value.length;
    const before = value.slice(0, autocomplete.start);
    const after = value.slice(caret);
    const insertion = `@${user.username} `;
    applyEdit({
      value: `${before}${insertion}${after}`,
      selectionStart: before.length + insertion.length,
      selectionEnd: before.length + insertion.length,
    });
    setAutocomplete(null);
  };

  const selectEmoji = (emoji: EmojiSearchItem) => {
    if (!autocomplete || autocomplete.type !== 'emoji') return;
    const el = textareaRef.current;
    const caret = el?.selectionStart ?? value.length;
    const before = value.slice(0, autocomplete.start);
    const after = value.slice(caret);
    const insertion = emoji.isCustom ? `:${emoji.name}:` : (emoji.native ?? `:${emoji.name}:`);
    applyEdit({
      value: `${before}${insertion}${after}`,
      selectionStart: before.length + insertion.length,
      selectionEnd: before.length + insertion.length,
    });
    setAutocomplete(null);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && !event.altKey) {
      const key = event.key.toLowerCase();
      if (key === 'b') {
        event.preventDefault();
        runWrap('**');
        return;
      }
      if (key === 'i') {
        event.preventDefault();
        runWrap('*');
        return;
      }
      if (key === 'k') {
        event.preventDefault();
        insertLink();
        return;
      }
    }

    if (!autocomplete || suggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + suggestions.length) % suggestions.length);
      return;
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      const item = suggestions[activeIndex];
      if (!item) return;
      if (autocomplete.type === 'mention') {
        selectMention(item as MentionSearchResult);
      } else {
        selectEmoji(item as EmojiSearchItem);
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setAutocomplete(null);
    }
  };

  const length = value.length;
  const overLimit = maxLength !== undefined && length > maxLength;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl glass-medium transition ring-offset-background',
        'focus-within:ring-2 focus-within:ring-[#F57C00]',
        disabled && 'opacity-60',
        className,
      )}
    >
      {showToolbar ? (
        <Toolbar
          disabled={disabled}
          preview={preview}
          onPreviewToggle={() => setPreview((value) => !value)}
          emojiEnabled={emojiEnabled}
          onAction={(action) => {
            switch (action) {
              case 'bold':
                runWrap('**');
                break;
              case 'italic':
                runWrap('*');
                break;
              case 'strike':
                runWrap('~~');
                break;
              case 'link':
                insertLink();
                break;
              case 'ul':
                runInsert('\n- ');
                break;
              case 'ol':
                runInsert('\n1. ');
                break;
              case 'quote':
                runInsert('\n> ');
                break;
              case 'code':
                runWrap('`');
                break;
              case 'codeblock':
                runWrap('\n```\n', '\n```\n');
                break;
              case 'spoiler':
                runWrap('||');
                break;
              case 'mention':
                runInsert('@');
                break;
              default:
                break;
            }
          }}
          onEmojiSelect={(emoji) => runInsert(emoji)}
        />
      ) : emojiEnabled ? (
        <div className="flex justify-end border-b border-white/5 px-2 py-1">
          <EmojiPickerButton disabled={disabled} onSelect={(emoji) => runInsert(emoji)} />
        </div>
      ) : null}

      <div className={cn(preview && showToolbar && 'grid gap-0 md:grid-cols-2')}>
        <div className="relative">
          <textarea
            id={editorId}
            ref={textareaRef}
            value={value}
            disabled={disabled}
            placeholder={placeholder}
            onChange={(event) => {
              const next = event.target.value;
              if (maxLength !== undefined && next.length > maxLength) {
                onChange(next.slice(0, maxLength));
              } else {
                onChange(next);
              }
              syncAutocomplete(event.target.value, event.target.selectionStart);
            }}
            onKeyUp={(event) => {
              const el = event.currentTarget;
              syncAutocomplete(el.value, el.selectionStart);
            }}
            onClick={(event) => {
              const el = event.currentTarget;
              syncAutocomplete(el.value, el.selectionStart);
            }}
            onKeyDown={onKeyDown}
            className="w-full resize-none bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            style={{ minHeight, maxHeight }}
          />

          {autocomplete && suggestions.length > 0 ? (
            <div className="absolute bottom-2 left-2 right-2 z-40 max-h-64 overflow-auto rounded-xl border border-white/10 bg-zinc-950/95 p-1 shadow-xl backdrop-blur">
              {autocomplete.type === 'mention'
                ? (suggestions as MentionSearchResult[]).map((user, index) => (
                    <button
                      key={user.id}
                      type="button"
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors',
                        index === activeIndex ? 'bg-[#F57C00]/20' : 'hover:bg-white/5',
                      )}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => selectMention(user)}
                    >
                      <SkinHead avatar={user.avatar} username={user.username} size={24} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span
                            className="truncate text-sm font-semibold"
                            style={{ color: user.position.color }}
                          >
                            {user.username}
                          </span>
                          {user.badges.slice(0, 2).map((badge) => (
                            <UserBadgeIcon
                              key={badge.type}
                              type={badge.type as UserBadgeType}
                              size={14}
                            />
                          ))}
                        </div>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {user.position.displayName}
                        </p>
                      </div>
                    </button>
                  ))
                : (suggestions as EmojiSearchItem[]).map((emoji, index) => (
                    <button
                      key={`${emoji.id}-${index}`}
                      type="button"
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors',
                        index === activeIndex ? 'bg-[#F57C00]/20' : 'hover:bg-white/5',
                      )}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => selectEmoji(emoji)}
                    >
                      {emoji.src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={emoji.src} alt={emoji.name} className="h-5 w-5" />
                      ) : (
                        <span className="text-base">{emoji.native}</span>
                      )}
                      <span className="text-sm text-muted-foreground">:{emoji.name}:</span>
                    </button>
                  ))}
            </div>
          ) : null}
        </div>

        {preview ? (
          <div className="border-t border-white/5 px-3 py-3 md:border-l md:border-t-0">
            {value.trim() ? (
              <MarkdownContent content={value} />
            ) : (
              <p className="text-sm text-muted-foreground">Предпросмотр пуст</p>
            )}
          </div>
        ) : null}
      </div>

      {maxLength !== undefined ? (
        <div
          className={cn(
            'border-t border-white/5 px-3 py-1.5 text-right text-xs',
            overLimit ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {length}/{maxLength}
        </div>
      ) : null}
    </div>
  );
}

function Toolbar({
  disabled,
  preview,
  onPreviewToggle,
  onAction,
  onEmojiSelect,
  emojiEnabled,
}: {
  disabled?: boolean;
  preview: boolean;
  onPreviewToggle: () => void;
  onAction: (action: string) => void;
  onEmojiSelect: (emoji: string) => void;
  emojiEnabled: boolean;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-white/5 px-2 py-1.5">
        <ToolBtn label="Жирный (Ctrl+B)" disabled={disabled} onClick={() => onAction('bold')}>
          <Bold className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn label="Курсив (Ctrl+I)" disabled={disabled} onClick={() => onAction('italic')}>
          <Italic className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn label="Зачёркнутый" disabled={disabled} onClick={() => onAction('strike')}>
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn label="Ссылка (Ctrl+K)" disabled={disabled} onClick={() => onAction('link')}>
          <Link2 className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn label="Список" disabled={disabled} onClick={() => onAction('ul')}>
          <List className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn label="Нумерованный список" disabled={disabled} onClick={() => onAction('ol')}>
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn label="Цитата" disabled={disabled} onClick={() => onAction('quote')}>
          <Quote className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn label="Код" disabled={disabled} onClick={() => onAction('code')}>
          <Code className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn label="Блок кода" disabled={disabled} onClick={() => onAction('codeblock')}>
          <SquareCode className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn label="Спойлер" disabled={disabled} onClick={() => onAction('spoiler')}>
          <span className="text-[10px] font-bold">||</span>
        </ToolBtn>
        <ToolBtn label="Упоминание" disabled={disabled} onClick={() => onAction('mention')}>
          <AtSign className="h-3.5 w-3.5" />
        </ToolBtn>
        {emojiEnabled ? (
          <EmojiPickerButton disabled={disabled} onSelect={onEmojiSelect} />
        ) : null}
        <div className="ml-auto">
          <ToolBtn
            label={preview ? 'Скрыть превью' : 'Превью'}
            disabled={disabled}
            onClick={onPreviewToggle}
          >
            {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </ToolBtn>
        </div>
      </div>
    </TooltipProvider>
  );
}

function ToolBtn({
  label,
  children,
  onClick,
  disabled,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          onClick={onClick}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-50"
          aria-label={label}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
