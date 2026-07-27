'use client';

import type { ChatMessage } from '@twomc/shared';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AdminEmptyState, AdminPageHeader } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, extractErrorMessage } from '@/lib/api';

export default function AdminChatSearchPage() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<ChatMessage[]>([]);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (q.trim().length < 2) {
      toast.error('Введите минимум 2 символа');
      return;
    }
    try {
      const { data } = await api.get<ChatMessage[]>('/admin/chat/messages/search', {
        params: { q: q.trim() },
      });
      setItems(data);
      setSearched(true);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Поиск не удался'));
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Поиск по чату" description="Сообщения во всех каналах" />
      <div className="flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Текст сообщения…"
          onKeyDown={(e) => {
            if (e.key === 'Enter') void search();
          }}
        />
        <Button onClick={() => void search()}>
          <Search className="mr-2 h-4 w-4" />
          Найти
        </Button>
      </div>

      {searched && items.length === 0 ? (
        <AdminEmptyState title="Ничего не найдено" description="Попробуйте другой запрос" />
      ) : (
        <div className="space-y-2">
          {items.map((m) => (
            <div key={m.id} className="rounded-lg border border-border p-3 text-sm">
              <p className="text-xs text-muted-foreground">
                {m.author?.username ?? '—'} · {new Date(m.createdAt).toLocaleString('ru-RU')}
              </p>
              <p className="mt-1 text-white">{m.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
