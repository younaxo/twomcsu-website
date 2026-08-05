'use client';

import { ChatPanel } from '@/components/chat/ChatPanel';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import { useChatStore } from '@/stores/chatStore';

export function ChatWidget() {
  const showWidget = useChatStore((s) => s.settings.showWidget);
  const isOpen = useChatStore((s) => s.isWidgetOpen);
  const setWidgetOpen = useChatStore((s) => s.setWidgetOpen);

  if (!showWidget) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setWidgetOpen}>
      <SheetContent
        side="right"
        className="glass-strong flex w-full flex-col gap-0 border-white/10 p-0 sm:max-w-md"
      >
        <SheetTitle className="sr-only">Чат TWOMC</SheetTitle>
        <div className="flex min-h-0 flex-1 flex-col">
          <ChatPanel compact className="min-h-0 flex-1 rounded-none border-0 bg-transparent" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
