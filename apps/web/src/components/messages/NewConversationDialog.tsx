'use client';

import type { Conversation, UserSearchResult } from '@twomc/shared';
import { MessageCircle, Plus, Users, X } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useCreateDirectConversation,
  useCreateGroupConversation,
} from '@/hooks/useDirectMessages';
import { extractErrorMessage } from '@/lib/api';

interface Props {
  onCreated: (conversation: Conversation) => void;
}

export function NewConversationDialog({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [directUser, setDirectUser] = useState<UserSearchResult | null>(null);
  const [title, setTitle] = useState('');
  const [members, setMembers] = useState<UserSearchResult[]>([]);
  const createDirect = useCreateDirectConversation();
  const createGroup = useCreateGroupConversation();

  const finish = (conversation: Conversation) => {
    setOpen(false);
    setDirectUser(null);
    setTitle('');
    setMembers([]);
    onCreated(conversation);
  };

  const submitDirect = async () => {
    if (!directUser) return;
    try {
      finish(await createDirect.mutateAsync(directUser.username));
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось открыть диалог'));
    }
  };

  const submitGroup = async () => {
    if (!title.trim()) {
      toast.error('Введите название группы');
      return;
    }
    try {
      finish(
        await createGroup.mutateAsync({
          title: title.trim(),
          usernames: members.map((member) => member.username),
        }),
      );
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось создать группу'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" aria-label="Новый диалог">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-strong sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Новый диалог</DialogTitle>
          <DialogDescription>Напишите пользователю или создайте группу до 10 человек.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="direct">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="direct" className="gap-2">
              <MessageCircle className="h-4 w-4" /> Один на один
            </TabsTrigger>
            <TabsTrigger value="group" className="gap-2">
              <Users className="h-4 w-4" /> Группа
            </TabsTrigger>
          </TabsList>
          <TabsContent value="direct" className="space-y-4 pt-2">
            {directUser ? (
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                <span className="font-medium">{directUser.username}</span>
                <Button variant="ghost" size="icon" onClick={() => setDirectUser(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <UserSearchInput onSelect={setDirectUser} placeholder="Найдите пользователя" autoFocus />
            )}
            <Button className="w-full" disabled={!directUser || createDirect.isPending} onClick={submitDirect}>
              Открыть диалог
            </Button>
          </TabsContent>
          <TabsContent value="group" className="space-y-4 pt-2">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Название группы"
              maxLength={80}
            />
            <UserSearchInput
              onSelect={(user) => {
                if (members.some((member) => member.id === user.id)) return;
                if (members.length >= 9) return toast.error('Можно добавить не больше 9 пользователей');
                setMembers((current) => [...current, user]);
              }}
              placeholder="Добавить друга"
            />
            {members.length ? (
              <div className="flex flex-wrap gap-2">
                {members.map((member) => (
                  <Badge key={member.id} variant="secondary" className="gap-1.5 py-1">
                    {member.username}
                    <button
                      type="button"
                      onClick={() => setMembers((current) => current.filter((item) => item.id !== member.id))}
                      aria-label={`Удалить ${member.username}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : null}
            <Button className="w-full" disabled={!title.trim() || createGroup.isPending} onClick={submitGroup}>
              Создать группу
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
