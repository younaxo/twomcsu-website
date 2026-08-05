'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useState } from 'react';

export default function ModerationNewsCommentsPage() {
  const [commentId, setCommentId] = useState('');

  const pin = async (pinned: boolean) => {
    if (!commentId.trim()) return;
    try {
      await api.patch(
        `/moderation/news/comments/${commentId.trim()}/${pinned ? 'pin' : 'unpin'}`,
      );
      toast.success(pinned ? 'Закреплено' : 'Откреплено');
    } catch {
      toast.error('Не удалось обновить комментарий');
    }
  };

  const remove = async () => {
    if (!commentId.trim()) return;
    try {
      await api.delete(`/moderation/news/comments/${commentId.trim()}`);
      toast.success('Комментарий удалён');
      setCommentId('');
    } catch {
      toast.error('Не удалось удалить');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-white">Модерация комментариев к новостям</h1>
      <p className="text-sm text-muted-foreground">
        Укажите ID комментария для закрепления или удаления. Действия также доступны на странице
        новости.
      </p>
      <div className="max-w-lg space-y-3 rounded-2xl glass-medium p-4">
        <Input
          value={commentId}
          onChange={(e) => setCommentId(e.target.value)}
          placeholder="ID комментария"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void pin(true)}>
            Закрепить
          </Button>
          <Button type="button" variant="secondary" onClick={() => void pin(false)}>
            Открепить
          </Button>
          <Button type="button" variant="ghost" onClick={() => void remove()}>
            Удалить
          </Button>
        </div>
      </div>
    </div>
  );
}
