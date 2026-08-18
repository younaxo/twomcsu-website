'use client';

import type { Conversation, GroupInvite, UserSearchResult } from '@twomc/shared';
import { CONVERSATION_ROLE_LABELS, ConversationRole } from '@twomc/shared';
import { Copy, Link2, Settings2, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { UserSearchInput } from '@/components/shared/UserSearchInput';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateGroupInvite } from '@/hooks/useDirectMessages';
import { api, extractErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

interface Props {
  conversation: Conversation;
  onChanged: () => void;
  onLeft?: () => void;
}

export function GroupSettingsDialog({ conversation, onChanged, onLeft }: Props) {
  const me = useAuthStore((state) => state.user);
  const createInvite = useCreateGroupInvite(conversation.id);
  const [invite, setInvite] = useState<GroupInvite | null>(null);
  const canManage = conversation.role !== ConversationRole.MEMBER;
  const isOwner = conversation.role === ConversationRole.OWNER;

  const addMember = async (user: UserSearchResult) => {
    try {
      await api.post(`/messages/conversations/${conversation.id}/members`, { username: user.username });
      toast.success(`${user.username} добавлен в группу`);
      onChanged();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось добавить пользователя'));
    }
  };

  const changeRole = async (userId: string, role: 'MODERATOR' | 'MEMBER') => {
    try {
      await api.patch(`/messages/conversations/${conversation.id}/members/${userId}`, { role });
      onChanged();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось изменить роль'));
    }
  };

  const removeMember = async (userId: string, username: string) => {
    try {
      await api.delete(`/messages/conversations/${conversation.id}/members/${userId}`);
      toast.success(userId === me?.id ? 'Вы покинули группу' : `${username} удалён из группы`);
      if (userId === me?.id) onLeft?.();
      else onChanged();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось удалить участника'));
    }
  };

  const generateInvite = async () => {
    try {
      setInvite(await createInvite.mutateAsync({ maxUses: 10, expiresInHours: 24 }));
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось создать приглашение'));
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Настройки группы">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-strong max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{conversation.title}</DialogTitle>
          <DialogDescription>{conversation.members.length} из 10 участников</DialogDescription>
        </DialogHeader>

        {canManage ? (
          <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <UserPlus className="h-4 w-4" /> Добавить друга
            </div>
            <UserSearchInput onSelect={(user) => void addMember(user)} placeholder="Никнейм друга" />
            <Button variant="secondary" className="w-full gap-2" onClick={() => void generateInvite()}>
              <Link2 className="h-4 w-4" /> Создать ссылку на 24 часа
            </Button>
            {invite ? (
              <div className="flex items-center gap-2 rounded-lg bg-black/20 p-2 text-xs">
                <span className="min-w-0 flex-1 truncate">{invite.url}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    void navigator.clipboard.writeText(invite.url);
                    toast.success('Ссылка скопирована');
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2">
          {conversation.members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{member.user.username}</p>
                <Badge variant="secondary" className="mt-1 text-[10px]">
                  {CONVERSATION_ROLE_LABELS[member.role]}
                </Badge>
              </div>
              {isOwner && member.role !== ConversationRole.OWNER ? (
                <Select
                  value={member.role}
                  onValueChange={(value) => void changeRole(member.user.id, value as 'MODERATOR' | 'MEMBER')}
                >
                  <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ConversationRole.MODERATOR}>Модератор</SelectItem>
                    <SelectItem value={ConversationRole.MEMBER}>Участник</SelectItem>
                  </SelectContent>
                </Select>
              ) : null}
              {(canManage && member.role !== ConversationRole.OWNER) || member.user.id === me?.id ? (
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => void removeMember(member.user.id, member.user.username)}
                  aria-label="Удалить участника"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
