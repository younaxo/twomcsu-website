'use client';

import { ChatPanel } from '@/components/chat/ChatPanel';
import {
  Sheet,
  SheetContent,
  SheetHeader,
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
        className="flex w-full flex-col gap-0 border-white/10 bg-[rgba(15,15,20,0.7)] p-0 backdrop-blur-[30px] sm:max-w-md"
      >
        <SheetHeader className="border-b border-white/10 px-4 py-3 text-left">
          <SheetTitle>Чат</SheetTitle>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col">
          <ChatPanel compact className="min-h-0 flex-1 rounded-none border-0 bg-transparent" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
