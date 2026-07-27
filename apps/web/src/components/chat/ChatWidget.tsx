'use client';

import { MessageCircle, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { useAuth } from '@/hooks/useAuth';
import { useChatStore } from '@/stores/chatStore';
import { cn } from '@/lib/utils';

export function ChatWidget() {
  const { isAuthenticated } = useAuth();
  const showWidget = useChatStore((s) => s.settings.showWidget);
  const isOpen = useChatStore((s) => s.isWidgetOpen);
  const setWidgetOpen = useChatStore((s) => s.setWidgetOpen);
  const unreadCounts = useChatStore((s) => s.unreadCounts);

  const unread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  if (!showWidget) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {isOpen ? (
        <div
          className={cn(
            'flex w-[min(100vw-2rem,420px)] flex-col overflow-hidden shadow-2xl',
            'h-[min(70vh,560px)] sm:h-[560px]',
          )}
        >
          <div className="flex items-center justify-between border-b border-border bg-card px-3 py-2">
            <p className="text-sm font-medium text-white">Чат</p>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setWidgetOpen(false)}
              aria-label="Закрыть чат"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ChatPanel compact className="min-h-0 flex-1 rounded-none border-0" />
        </div>
      ) : null}

      <Button
        size="lg"
        className="relative h-14 w-14 rounded-full shadow-lg"
        onClick={() => setWidgetOpen(!isOpen)}
        aria-label="Открыть чат"
      >
        <MessageCircle className="h-6 w-6" />
        {unread > 0 && !isOpen ? (
          <Badge
            variant="destructive"
            className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1"
          >
            {unread > 99 ? '99+' : unread}
          </Badge>
        ) : null}
        {!isAuthenticated ? (
          <span className="sr-only">Требуется вход</span>
        ) : null}
      </Button>
    </div>
  );
}
