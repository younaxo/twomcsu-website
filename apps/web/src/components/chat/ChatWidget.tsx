'use client';

import { MessageCircle } from 'lucide-react';
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
            'flex w-[min(100vw-2rem,420px)] flex-col overflow-hidden rounded-2xl shadow-2xl',
            'h-[min(70vh,560px)] sm:h-[560px]',
          )}
        >
          <ChatPanel
            compact
            className="min-h-0 flex-1 rounded-2xl border-0"
            onClose={() => setWidgetOpen(false)}
          />
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
        {!isAuthenticated ? <span className="sr-only">Требуется вход</span> : null}
      </Button>
    </div>
  );
}
