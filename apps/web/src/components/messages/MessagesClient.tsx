'use client';

import type {
  CommentEmoji,
  Conversation,
  DirectMessage,
  DirectMessagesResponse,
} from '@twomc/shared';
import {
  COMMENT_EMOJIS,
  COMMENT_EMOJI_CHARS,
  ConversationRole,
  ConversationType,
} from '@twomc/shared';
import { useQueryClient } from '@tanstack/react-query';
import { format, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  ArrowLeft,
  CheckCheck,
  File,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Reply,
  Search,
  Send,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/EmptyState';
import { ImageWithPreview } from '@/components/shared/ImageWithPreview';
import { MarkdownContent } from '@/components/shared/MarkdownContent';
import { DefaultAvatar } from '@/components/shared/DefaultAvatar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  useConversation,
  useConversations,
  useDeleteDirectMessage,
  useDirectMessageItems,
  useEditDirectMessage,
  useMarkConversationRead,
  useReactToDirectMessage,
  useSendDirectMessage,
  useSendDirectMessageAttachment,
} from '@/hooks/useDirectMessages';
import { useDirectMessagesSocket } from '@/hooks/useDirectMessagesSocket';
import { useAuth } from '@/hooks/useAuth';
import { extractErrorMessage } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/profile';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import { GroupSettingsDialog } from './GroupSettingsDialog';
import { MessagesPrivacyDialog } from './MessagesPrivacyDialog';
import { NewConversationDialog } from './NewConversationDialog';

function ConversationAvatar({ conversation, size = 'md' }: { conversation: Conversation; size?: 'sm' | 'md' }) {
  const dimensions = size === 'sm' ? 'h-9 w-9' : 'h-11 w-11';
  return (
    <Avatar className={dimensions}>
      <AvatarImage src={resolveMediaUrl(conversation.avatar)} alt={conversation.title} />
      <AvatarFallback className="p-0">
        {conversation.type === ConversationType.GROUP ? (
          <span className="flex h-full w-full items-center justify-center bg-primary/15 text-primary"><Users className="h-5 w-5" /></span>
        ) : (
          <DefaultAvatar username={conversation.title} />
        )}
      </AvatarFallback>
    </Avatar>
  );
}

function formatConversationTime(value: string) {
  const date = new Date(value);
  return isToday(date) ? format(date, 'HH:mm') : format(date, 'd MMM', { locale: ru });
}

function ConversationList({
  items,
  activeId,
  query,
  onQueryChange,
  onSelect,
}: {
  items: Conversation[];
  activeId: string | null;
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (conversation: Conversation) => void;
}) {
  return (
    <aside className={cn('min-h-0 border-r border-white/5', activeId && 'hidden lg:flex', 'flex-col')}>
      <div className="flex h-16 items-center gap-2 border-b border-white/5 px-3">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Поиск диалогов"
            className="h-10 pl-9"
          />
        </div>
        <MessagesPrivacyDialog />
        <NewConversationDialog onCreated={onSelect} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {items.length ? items.map((conversation) => (
          <button
            key={conversation.id}
            type="button"
            onClick={() => onSelect(conversation)}
            className={cn(
              'mb-1 flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors',
              activeId === conversation.id ? 'bg-primary/15' : 'hover:bg-white/[0.05]',
            )}
          >
            <ConversationAvatar conversation={conversation} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-sm font-semibold">{conversation.title}</p>
                <span className="text-[10px] text-muted-foreground">{formatConversationTime(conversation.lastMessageAt)}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                  {conversation.lastMessage?.isDeleted
                    ? 'Сообщение удалено'
                    : conversation.lastMessage?.content || (conversation.lastMessage?.attachments.length ? 'Файл' : 'Нет сообщений')}
                </p>
                {conversation.unreadCount ? (
                  <Badge className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px]">
                    {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                  </Badge>
                ) : null}
              </div>
            </div>
          </button>
        )) : (
          <EmptyState icon={MessageCircle} title="Диалогов пока нет" description="Начните новый разговор с другом или участником сообщества." />
        )}
      </div>
    </aside>
  );
}

function MessageAttachmentView({ attachment }: { attachment: DirectMessage['attachments'][number] }) {
  const url = resolveMediaUrl(attachment.fileUrl) ?? attachment.fileUrl;
  if (attachment.mimeType.startsWith('image/')) {
    return (
      <ImageWithPreview
        src={url}
        alt={attachment.fileName}
        className="mt-2 max-h-72 max-w-sm rounded-xl"
        imgClassName="max-h-72 object-contain"
      />
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="mt-2 flex max-w-sm items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3 hover:bg-black/30"
    >
      <File className="h-5 w-5 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-sm">{attachment.fileName}</span>
      <span className="text-[10px] text-muted-foreground">{Math.ceil(attachment.size / 1024)} КБ</span>
    </a>
  );
}

function MessageBubble({
  message,
  own,
  read,
  onReply,
  onEdit,
  onDelete,
  canDelete,
  onReact,
}: {
  message: DirectMessage;
  own: boolean;
  read: boolean;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canDelete: boolean;
  onReact: (emoji: CommentEmoji) => void;
}) {
  return (
    <div className={cn('group flex', own ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[88%] sm:max-w-[75%]', own ? 'items-end' : 'items-start')}>
        {!own ? <p className="mb-1 px-2 text-xs font-medium text-primary">{message.sender?.username ?? 'Удалённый пользователь'}</p> : null}
        <div className={cn(
          'relative rounded-2xl border px-3.5 py-2.5',
          own ? 'rounded-br-md border-primary/20 bg-primary/15' : 'rounded-bl-md border-white/10 bg-white/[0.06]',
        )}>
          {message.parent ? (
            <div className="mb-2 border-l-2 border-primary/60 pl-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground/80">{message.parent.sender?.username ?? 'Пользователь'}</p>
              <p className="truncate">{message.parent.content}</p>
            </div>
          ) : null}
          {message.isDeleted ? (
            <p className="text-sm italic text-muted-foreground">Сообщение удалено</p>
          ) : (
            <>
              {message.content ? <MarkdownContent content={message.content} html={message.contentHtml} className="text-sm" /> : null}
              {message.attachments.map((attachment) => <MessageAttachmentView key={attachment.id} attachment={attachment} />)}
            </>
          )}
          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
            {message.isEdited ? <span>изменено</span> : null}
            <span>{format(new Date(message.createdAt), 'HH:mm')}</span>
            {own && read ? <CheckCheck className="h-3.5 w-3.5 text-primary" /> : null}
          </div>
          {!message.isDeleted ? (
            <div className={cn('absolute top-0 hidden -translate-y-1/2 items-center rounded-lg border border-white/10 bg-neutral-900 p-0.5 shadow-lg group-hover:flex', own ? 'right-2' : 'left-2')}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-7 w-7"><span className="text-sm">🙂</span></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="flex min-w-0 gap-1 p-1">
                  {COMMENT_EMOJIS.map((emoji) => (
                    <button key={emoji} type="button" className="rounded p-1 text-lg hover:bg-white/10" onClick={() => onReact(emoji)}>
                      {COMMENT_EMOJI_CHARS[emoji]}
                    </button>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onReply}><Reply className="h-3.5 w-3.5" /></Button>
              {own || canDelete ? <DropdownMenu>
                <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align={own ? 'end' : 'start'}>
                  {own ? <DropdownMenuItem onSelect={onEdit}><Pencil className="mr-2 h-4 w-4" />Редактировать</DropdownMenuItem> : null}
                  {own ? <DropdownMenuSeparator /> : null}
                  {canDelete ? <DropdownMenuItem onSelect={onDelete} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Удалить</DropdownMenuItem> : null}
                </DropdownMenuContent>
              </DropdownMenu> : null}
            </div>
          ) : null}
        </div>
        {message.reactions.length ? (
          <div className={cn('mt-1 flex flex-wrap gap-1', own && 'justify-end')}>
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                type="button"
                onClick={() => onReact(reaction.emoji as CommentEmoji)}
                className={cn('rounded-full border px-2 py-0.5 text-xs', reaction.reactedByMe ? 'border-primary/40 bg-primary/15' : 'border-white/10 bg-white/5')}
              >
                {COMMENT_EMOJI_CHARS[reaction.emoji as CommentEmoji] ?? reaction.emoji} {reaction.count}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function MessagesClient() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('conversation');
  const { user } = useAuth();
  const qc = useQueryClient();
  const conversations = useConversations(Boolean(user));
  const [activeId, setActiveId] = useState<string | null>(initialId);
  const [query, setQuery] = useState('');
  const [text, setText] = useState('');
  const [reply, setReply] = useState<DirectMessage | null>(null);
  const [editing, setEditing] = useState<DirectMessage | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const listEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMarkedRead = useRef<string | null>(null);
  const { socket, connected } = useDirectMessagesSocket(Boolean(user));

  const details = useConversation(activeId);
  const messages = useDirectMessageItems(activeId);
  const send = useSendDirectMessage(activeId ?? '');
  const sendFile = useSendDirectMessageAttachment(activeId ?? '');
  const edit = useEditDirectMessage();
  const remove = useDeleteDirectMessage();
  const react = useReactToDirectMessage();
  const markRead = useMarkConversationRead();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (conversations.data?.items ?? []).filter((item) => !needle || item.title.toLowerCase().includes(needle));
  }, [conversations.data?.items, query]);

  useEffect(() => {
    if (!activeId && conversations.data?.items[0] && window.innerWidth >= 1024) {
      setActiveId(conversations.data.items[0].id);
    }
  }, [activeId, conversations.data?.items]);

  const upsertMessage = useCallback((message: DirectMessage) => {
    qc.setQueryData<DirectMessagesResponse>(queryKeys.directMessages(message.conversationId), (current) => {
      const items = current?.items ?? [];
      const index = items.findIndex((item) => item.id === message.id);
      return {
        hasMore: current?.hasMore ?? false,
        items: index >= 0
          ? items.map((item) => item.id === message.id ? message : item)
          : [...items, message],
      };
    });
  }, [qc]);

  useEffect(() => {
    if (!socket) return;
    const onNew = (message: DirectMessage) => {
      upsertMessage(message);
      void qc.invalidateQueries({ queryKey: queryKeys.conversations });
    };
    const onUpdated = (message: DirectMessage) => upsertMessage(message);
    const onRead = (payload: { conversationId: string }) => {
      if (payload.conversationId === activeId) {
        void qc.invalidateQueries({ queryKey: queryKeys.conversation(activeId) });
      }
    };
    const onConversation = () => {
      void qc.invalidateQueries({ queryKey: queryKeys.conversations });
      if (activeId) void qc.invalidateQueries({ queryKey: queryKeys.conversation(activeId) });
    };
    const onTyping = (payload: { conversationId: string; userId: string; username: string }) => {
      if (payload.conversationId === activeId) setTypingUsers((current) => ({ ...current, [payload.userId]: payload.username }));
    };
    const onTypingStop = (payload: { conversationId: string; userId: string }) => {
      if (payload.conversationId === activeId) setTypingUsers((current) => {
        const next = { ...current };
        delete next[payload.userId];
        return next;
      });
    };
    socket.on('message:new', onNew);
    socket.on('message:updated', onUpdated);
    socket.on('conversation:read', onRead);
    socket.on('conversation:changed', onConversation);
    socket.on('typing:start', onTyping);
    socket.on('typing:stop', onTypingStop);
    return () => {
      socket.off('message:new', onNew);
      socket.off('message:updated', onUpdated);
      socket.off('conversation:read', onRead);
      socket.off('conversation:changed', onConversation);
      socket.off('typing:start', onTyping);
      socket.off('typing:stop', onTypingStop);
    };
  }, [activeId, qc, socket, upsertMessage]);

  useEffect(() => {
    if (!socket || !activeId) return;
    socket.emit('conversation:join', { conversationId: activeId });
    return () => { socket.emit('conversation:leave', { conversationId: activeId }); };
  }, [activeId, socket]);

  useEffect(() => {
    const last = messages.data?.items.at(-1);
    if (!activeId || !last || last.sender?.id === user?.id) return;
    const readKey = `${activeId}:${last.id}`;
    if (lastMarkedRead.current === readKey) return;
    lastMarkedRead.current = readKey;
    markRead.mutate(
      { conversationId: activeId, messageId: last.id },
      { onError: () => { lastMarkedRead.current = null; } },
    );
  }, [activeId, markRead, messages.data?.items, user?.id]);

  useEffect(() => () => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
  }, []);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ block: 'end' });
  }, [activeId, messages.data?.items.length]);

  const chooseConversation = (conversation: Conversation) => {
    setActiveId(conversation.id);
    window.history.replaceState(null, '', `/messages?conversation=${conversation.id}`);
  };

  const submit = async () => {
    if (!activeId || !text.trim()) return;
    try {
      if (editing) {
        const result = await edit.mutateAsync({ messageId: editing.id, content: text.trim() });
        upsertMessage(result);
      } else {
        const result = await send.mutateAsync({ content: text.trim(), parentId: reply?.id });
        upsertMessage(result);
      }
      setText('');
      setReply(null);
      setEditing(null);
      socket?.emit('typing:stop', { conversationId: activeId });
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось отправить сообщение'));
    }
  };

  const upload = async (file: File) => {
    if (!activeId) return;
    try {
      const result = await sendFile.mutateAsync({ file, content: text.trim() || undefined, parentId: reply?.id });
      upsertMessage(result);
      setText('');
      setReply(null);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось отправить файл'));
    }
  };

  const notifyTyping = (value: string) => {
    setText(value);
    if (!activeId || !socket) return;
    socket.emit('typing:start', { conversationId: activeId });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket.emit('typing:stop', { conversationId: activeId }), 1200);
  };

  const activeConversation = details.data ?? conversations.data?.items.find((item) => item.id === activeId);
  const typingLabel = Object.values(typingUsers).length
    ? `${Object.values(typingUsers).slice(0, 2).join(', ')} печатает…`
    : null;

  if (conversations.isLoading) {
    return <div className="grid h-[calc(100vh-8rem)] gap-0 overflow-hidden rounded-2xl glass-medium lg:grid-cols-[320px_1fr]"><Skeleton className="h-full" /><Skeleton className="h-full" /></div>;
  }

  return (
    <div className="h-[calc(100dvh-7rem)] min-h-[520px] overflow-hidden rounded-2xl border border-white/5 glass-medium lg:grid lg:grid-cols-[320px_minmax(0,1fr)]">
      <ConversationList
        items={filtered}
        activeId={activeId}
        query={query}
        onQueryChange={setQuery}
        onSelect={chooseConversation}
      />
      {activeId && activeConversation ? (
        <section className="flex h-full min-h-0 flex-col">
          <header className="flex h-16 shrink-0 items-center gap-3 border-b border-white/5 px-3 sm:px-4">
            <Button size="icon" variant="ghost" className="lg:hidden" onClick={() => { setActiveId(null); window.history.replaceState(null, '', '/messages'); }}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <ConversationAvatar conversation={activeConversation} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{activeConversation.title}</p>
              <p className="text-xs text-muted-foreground">
                {typingLabel ?? (activeConversation.type === ConversationType.GROUP ? `${activeConversation.members.length} участников` : connected ? 'В сети сообщений' : 'Подключение…')}
              </p>
            </div>
            {activeConversation.type === ConversationType.GROUP ? (
              <GroupSettingsDialog
                conversation={activeConversation}
                onChanged={() => { void details.refetch(); void conversations.refetch(); }}
                onLeft={() => { setActiveId(null); window.history.replaceState(null, '', '/messages'); }}
              />
            ) : (
              <Button variant="ghost" size="sm" asChild><Link href={`/users/${activeConversation.title}`}>Профиль</Link></Button>
            )}
          </header>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-5">
            {messages.isLoading ? Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className={cn('h-16 w-2/3 rounded-2xl', index % 2 && 'ml-auto')} />) : null}
            {!messages.isLoading && !messages.data?.items.length ? (
              <EmptyState icon={MessageCircle} title="Начните разговор" description="Сообщения поддерживают Markdown, ответы, реакции и файлы." />
            ) : null}
            {messages.data?.items.map((message) => {
              const own = message.sender?.id === user?.id;
              const read = own && activeConversation.members.some(
                (member) => member.user.id !== user?.id && new Date(member.lastReadAt) >= new Date(message.createdAt),
              );
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  own={own}
                  read={read}
                  canDelete={own || (
                    activeConversation.type === ConversationType.GROUP
                    && activeConversation.role !== ConversationRole.MEMBER
                  )}
                  onReply={() => { setReply(message); setEditing(null); }}
                  onEdit={() => { setEditing(message); setReply(null); setText(message.content); }}
                  onDelete={async () => {
                    try { upsertMessage(await remove.mutateAsync(message.id)); }
                    catch (error) { toast.error(extractErrorMessage(error, 'Не удалось удалить сообщение')); }
                  }}
                  onReact={async (emoji) => {
                    try { upsertMessage(await react.mutateAsync({ messageId: message.id, emoji })); }
                    catch (error) { toast.error(extractErrorMessage(error, 'Не удалось поставить реакцию')); }
                  }}
                />
              );
            })}
            <div ref={listEndRef} />
          </div>

          <footer className="shrink-0 border-t border-white/5 bg-black/10 p-3 sm:p-4">
            {reply || editing ? (
              <div className="mb-2 flex items-center gap-2 rounded-xl border-l-2 border-primary bg-white/5 px-3 py-2 text-xs">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-primary">{editing ? 'Редактирование' : `Ответ: ${reply?.sender?.username ?? 'пользователь'}`}</p>
                  <p className="truncate text-muted-foreground">{editing?.content ?? reply?.content}</p>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setReply(null); setEditing(null); setText(''); }}><X className="h-4 w-4" /></Button>
              </div>
            ) : null}
            <div className="flex items-end gap-2">
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain"
                onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ''; }}
              />
              <Button size="icon" variant="ghost" className="shrink-0" onClick={() => fileRef.current?.click()} disabled={sendFile.isPending}>
                <Paperclip className="h-5 w-5" />
              </Button>
              <Textarea
                value={text}
                onChange={(event) => notifyTyping(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void submit(); }
                }}
                placeholder="Сообщение…"
                className="max-h-36 min-h-10 resize-none"
                maxLength={4000}
              />
              <Button size="icon" className="shrink-0" onClick={() => void submit()} disabled={!text.trim() || send.isPending || edit.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </footer>
        </section>
      ) : (
        <section className="hidden h-full items-center justify-center lg:flex">
          <EmptyState icon={MessageCircle} title="Выберите диалог" description="Или начните новый разговор с пользователем." />
        </section>
      )}
    </div>
  );
}
