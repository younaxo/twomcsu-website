'use client';

import { ChatPanel } from '@/components/chat/ChatPanel';

export default function ChatPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">Чат</h1>
        <p className="text-sm text-muted-foreground">Общение игроков сервера</p>
      </div>
      <ChatPanel className="h-[min(75vh,720px)]" />
    </div>
  );
}
