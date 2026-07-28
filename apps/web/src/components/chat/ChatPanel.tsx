'use client';

import type { ChatMessage } from '@twomc/shared';
import { RoleGroup, hasRoleGroup } from '@twomc/shared';
import { Info, MessageSquare, Pin, Users, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageInput } from '@/components/chat/MessageInput';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useChatChannel,
  useChatMessages,
  useChatOnline,
  useChatPinned,
  useLoadOlderMessages,
} from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores/chatStore';

const GENERAL_SLUG = 'general';

interface ChatPanelProps {
  className?: string;
  compact?: boolean;
  onClose?: () => void;
}

export function ChatPanel({ className, compact, onClose }: ChatPanelProps) {
  const { user, isAuthenticated } = useAuth();
  const { socket, connected } = useSocket(isAuthenticated);
  const settings = useChatStore((s) => s.settings);
  const setCurrentChannel = useChatStore((s) => s.setCurrentChannel);
  const clearUnread = useChatStore((s) => s.clearUnread);
  const incrementUnread = useChatStore((s) => s.incrementUnread);
  const typingByChannel = useChatStore((s) => s.typingByChannel);
  const setTyping = useChatStore((s) => s.setTyping);
  const isWidgetOpen = useChatStore((s) => s.isWidgetOpen);

  const slug = GENERAL_SLUG;
  const channelQuery = useChatChannel(slug);
  const messagesQuery = useChatMessages(slug);
  const onlineQuery = useChatOnline(slug);
  const pinnedQuery = useChatPinned(slug);
  const loadOlder = useLoadOlderMessages();

  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [showOnline, setShowOnline] = useState(!compact);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const stickBottom = useRef(true);
  const [newBelow, setNewBelow] = useState(0);

  const channel = channelQuery.data;
  const canModerate = user
    ? hasRoleGroup(user.roleGroup, RoleGroup.MODERATOR)
    : false;

  const pinnedMessages = useMemo(
    () => (pinnedQuery.data ?? []).slice(0, 3),
    [pinnedQuery.data],
  );

  useEffect(() => {
    setCurrentChannel(slug);
  }, [slug, setCurrentChannel]);

  useEffect(() => {
    setLocalMessages(messagesQuery.data?.items ?? []);
  }, [messagesQuery.data?.items]);

  useEffect(() => {
    if (!socket || !channel) return;

    socket.emit('join_channel', { channelId: channel.id });

    const onNew = (message: ChatMessage) => {
      if (message.channelId !== channel.id) return;
      setLocalMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      if (!stickBottom.current) {
        setNewBelow((n) => n + 1);
      } else {
        requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
      }
      if (!isWidgetOpen) {
        incrementUnread(channel.slug);
      }
    };

    const onEdited = (message: ChatMessage) => {
      if (message.channelId !== channel.id) return;
      setLocalMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
    };

    const onDeleted = (message: ChatMessage) => {
      if (message.channelId !== channel.id) return;
      setLocalMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
    };

    const onPinned = (message: ChatMessage) => {
      if (message.channelId !== channel.id) return;
      setLocalMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
      void pinnedQuery.refetch();
    };

    const onTyping = (payload: { channelId: string; username: string }) => {
      if (payload.channelId !== channel.id || !settings.showTyping) return;
      const current = useChatStore.getState().typingByChannel[channel.id] ?? [];
      if (!current.includes(payload.username)) {
        setTyping(channel.id, [...current, payload.username]);
      }
    };

    const onStopTyping = (payload: { channelId: string; userId: string; username?: string }) => {
      if (payload.channelId !== channel.id) return;
      const current = useChatStore.getState().typingByChannel[channel.id] ?? [];
      setTyping(
        channel.id,
        current.filter((u) => u !== payload.username),
      );
    };

    socket.on('message:new', onNew);
    socket.on('message:edited', onEdited);
    socket.on('message:deleted', onDeleted);
    socket.on('message:pinned', onPinned);
    socket.on('message:unpinned', onPinned);
    socket.on('user:typing', onTyping);
    socket.on('user:stopped_typing', onStopTyping);

    return () => {
      socket.emit('leave_channel', { channelId: channel.id });
      socket.off('message:new', onNew);
      socket.off('message:edited', onEdited);
      socket.off('message:deleted', onDeleted);
      socket.off('message:pinned', onPinned);
      socket.off('message:unpinned', onPinned);
      socket.off('user:typing', onTyping);
      socket.off('user:stopped_typing', onStopTyping);
    };
  }, [
    socket,
    channel,
    settings.showTyping,
    setTyping,
    incrementUnread,
    isWidgetOpen,
    pinnedQuery,
  ]);

  useEffect(() => {
    clearUnread(slug);
  }, [slug, clearUnread]);

  useEffect(() => {
    if (stickBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [localMessages.length]);

  const typingLabel = useMemo(() => {
    const names = channel ? typingByChannel[channel.id] ?? [] : [];
    const filtered = names.filter((n) => n !== user?.username);
    if (filtered.length === 0) return null;
    if (filtered.length === 1) return `${filtered[0]} печатает…`;
    if (filtered.length === 2) return `${filtered[0]} и ${filtered[1]} печатают…`;
    return `${filtered.length} человек печатают…`;
  }, [typingByChannel, channel, user?.username]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    stickBottom.current = atBottom;
    if (atBottom) setNewBelow(0);

    if (el.scrollTop < 40 && messagesQuery.data?.hasMore && !loadOlder.isPending && slug) {
      const oldest = localMessages[0];
      if (oldest) {
        void loadOlder.mutateAsync({ slug, before: oldest.createdAt }).then((data) => {
          setLocalMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            return [...data.items.filter((m) => !ids.has(m.id)), ...prev];
          });
        });
      }
    }
  };

  const emitAck = useCallback(
    async <T,>(event: string, payload: unknown): Promise<T & { ok: boolean; error?: string }> => {
      if (!socket) throw new Error('Нет соединения');
      return new Promise((resolve) => {
        socket.timeout(8000).emit(event, payload, (err: Error | null, res: T & { ok: boolean; error?: string }) => {
          if (err) resolve({ ok: false, error: err.message } as T & { ok: boolean; error?: string });
          else resolve(res);
        });
      });
    },
    [socket],
  );

  const send = async (content: string) => {
    if (!channel) return;
    const res = await emitAck<{ ok: boolean; error?: string; message?: ChatMessage }>(
      'send_message',
      { channelId: channel.id, content, parentId: replyTo?.id },
    );
    if (!res.ok) {
      toast.error(res.error ?? 'Не удалось отправить');
      return;
    }
    setReplyTo(null);
    stickBottom.current = true;
  };

  return (
    <div className={cn('flex h-full min-h-0 flex-col rounded-xl glass-strong', className)}>
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
        <div>
          <p className="text-sm font-medium text-white">Чат TWOMC</p>
          <p className="text-xs text-muted-foreground">
            {onlineQuery.data != null
              ? `🟢 ${onlineQuery.data.length} онлайн`
              : connected
                ? 'Онлайн'
                : isAuthenticated
                  ? 'Подключение…'
                  : 'Войдите, чтобы писать'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Справка">
                <Info className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 space-y-1 p-3">
              <p className="mb-2 text-xs font-medium text-white">Разметка сообщений</p>
              {[
                ['**текст**', 'Жирный'],
                ['*текст*', 'Курсив'],
                ['~~текст~~', 'Зачёркнутый'],
                ['||текст||', 'Спойлер'],
                ['`код`', 'Код'],
                ['> цитата', 'Цитата'],
                ['@ник', 'Упоминание'],
              ].map(([syn, desc]) => (
                <div key={syn} className="flex items-center justify-between gap-2 text-xs">
                  <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[11px] text-primary">
                    {syn}
                  </code>
                  <span className="text-muted-foreground">{desc}</span>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setShowOnline((v) => !v)}
            aria-label="Онлайн"
          >
            <Users className="h-4 w-4" />
          </Button>
          {onClose ? (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClose} aria-label="Закрыть">
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="relative flex min-w-0 flex-1 flex-col">
          <div
            ref={listRef}
            onScroll={onScroll}
            className="flex-1 space-y-1 overflow-y-auto px-2 py-3"
          >
            {pinnedMessages.length > 0 ? (
              <div className="sticky top-0 z-10 -mx-2 mb-2 space-y-1.5 bg-card/95 px-2 pb-2 pt-1 backdrop-blur-sm">
                {pinnedMessages.map((message) => (
                  <div
                    key={`pin-${message.id}`}
                    className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2"
                  >
                    <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-amber-300">
                      <Pin className="h-3.5 w-3.5" />
                      Закреплено
                      {message.author?.username ? (
                        <span className="font-normal text-muted-foreground">
                          · {message.author.username}
                        </span>
                      ) : null}
                    </div>
                    <p className="line-clamp-2 text-sm text-foreground/90">{message.content}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {messagesQuery.isLoading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : localMessages.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="Пока нет сообщений"
                description="Будьте первым!"
                className="border-0 bg-transparent py-10"
              />
            ) : (
              localMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  currentUserId={user?.id}
                  canModerate={canModerate}
                  onReply={setReplyTo}
                  onDelete={(messageId) => {
                    void emitAck('delete_message', { messageId });
                  }}
                  onPin={(messageId, unpin) => {
                    void emitAck('pin_message', { messageId, unpin }).then((res) => {
                      if (!res.ok) toast.error(res.error ?? 'Не удалось закрепить');
                      else void pinnedQuery.refetch();
                    });
                  }}
                />
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {newBelow > 0 ? (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
              <Button
                size="sm"
                onClick={() => {
                  stickBottom.current = true;
                  setNewBelow(0);
                  bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                ↓ {newBelow} новых
              </Button>
            </div>
          ) : null}

          {typingLabel ? (
            <p className="px-3 pb-1 text-xs text-muted-foreground">{typingLabel}</p>
          ) : null}

          <div className="px-3 pb-3">
            {!isAuthenticated ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-2 text-center text-sm text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline">
                  Войдите
                </Link>
                , чтобы писать в чат
              </p>
            ) : (
              <MessageInput
                disabled={!connected || !channel}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                onSend={(content) => void send(content)}
                onTypingStart={() => {
                  if (channel) socket?.emit('typing_start', { channelId: channel.id });
                }}
                onTypingStop={() => {
                  if (channel) socket?.emit('typing_stop', { channelId: channel.id });
                }}
              />
            )}
          </div>
        </div>

        {showOnline ? (
          <aside className="hidden w-44 shrink-0 overflow-y-auto border-l border-white/10 p-2 md:block">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Онлайн ({onlineQuery.data?.length ?? 0})
            </p>
            <div className="space-y-1">
              {(onlineQuery.data ?? []).map((u) => (
                <Link
                  key={u.id}
                  href={`/users/${u.username}`}
                  className="block w-full truncate rounded-lg px-1.5 py-1 text-left text-sm transition-colors duration-150 hover:bg-white/5 hover:underline"
                >
                  {u.username}
                </Link>
              ))}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
