'use client';

import { RoleGroup, hasRoleGroup } from '@twomc/shared';
import {
  AlertTriangle,
  Ban,
  Flag,
  MoreHorizontal,
  Trash2,
  User,
  UserCog,
  UserPlus,
  UserX,
  VolumeX,
  X,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { BanDialog } from '@/components/moderation/BanDialog';
import { MuteDurationSelect } from '@/components/moderation/MuteDurationSelect';
import { WarnDialog } from '@/components/moderation/WarnDialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { api, extractErrorMessage } from '@/lib/api';

interface UserContextMenuProps {
  user: { id: string; username: string; avatar?: string | null };
  messageId?: string;
  commentId?: string;
  children?: ReactNode;
  triggerClassName?: string;
}

export function UserContextMenu({
  user,
  messageId,
  commentId,
  children,
  triggerClassName,
}: UserContextMenuProps) {
  const { user: me, isAuthenticated } = useAuth();
  const [muteOpen, setMuteOpen] = useState(false);
  const [warnOpen, setWarnOpen] = useState(false);
  const [banOpen, setBanOpen] = useState(false);
  const [hardDeleteOpen, setHardDeleteOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [hardDeleteReason, setHardDeleteReason] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isAuthenticated || !me) {
    return (
      <Link href={`/users/${user.username}`} className={triggerClassName}>
        {children}
      </Link>
    );
  }

  const isSelf = me.id === user.id;
  const isHelper = hasRoleGroup(me.roleGroup, RoleGroup.HELPER);
  const isModerator = hasRoleGroup(me.roleGroup, RoleGroup.MODERATOR);
  const isAdmin = hasRoleGroup(me.roleGroup, RoleGroup.ADMIN);
  const isOwner = hasRoleGroup(me.roleGroup, RoleGroup.OWNER);

  const run = async (fn: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(success);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось выполнить действие'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {children ? (
            <button type="button" className={triggerClassName}>
              {children}
            </button>
          ) : (
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="glass-strong w-56 border-white/10">
          <DropdownMenuItem asChild>
            <Link href={`/users/${user.username}`} className="cursor-pointer gap-2">
              <User className="h-4 w-4" />
              Открыть профиль
            </Link>
          </DropdownMenuItem>
          {!isSelf ? (
            <>
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onSelect={() => {
                  void run(
                    () => api.post(`/friends/request/${encodeURIComponent(user.username)}`),
                    'Заявка отправлена',
                  );
                }}
              >
                <UserPlus className="h-4 w-4" />
                Добавить в друзья
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/report?user=${user.username}`} className="cursor-pointer gap-2">
                  <Flag className="h-4 w-4" />
                  Пожаловаться
                </Link>
              </DropdownMenuItem>
            </>
          ) : null}

          {!isSelf && isHelper ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer gap-2" onSelect={() => setMuteOpen(true)}>
                <VolumeX className="h-4 w-4" />
                Замутить
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer gap-2" onSelect={() => setWarnOpen(true)}>
                <AlertTriangle className="h-4 w-4" />
                Предупредить
              </DropdownMenuItem>
            </>
          ) : null}

          {!isSelf && isModerator && messageId ? (
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-destructive"
              onSelect={() => setHardDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Удалить сообщение
            </DropdownMenuItem>
          ) : null}

          {!isSelf && isModerator && commentId ? (
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-destructive"
              onSelect={() => setHardDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Удалить комментарий
            </DropdownMenuItem>
          ) : null}

          {!isSelf && isModerator ? (
            <>
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onSelect={() => {
                  const reason = window.prompt('Причина кика');
                  if (!reason?.trim()) return;
                  void run(
                    () => api.post(`/moderation/users/${user.id}/kick`, { reason }),
                    'Игрок кикнут',
                  );
                }}
              >
                <X className="h-4 w-4" />
                Кикнуть с сервера
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer gap-2" onSelect={() => setBanOpen(true)}>
                <Ban className="h-4 w-4" />
                Бан аккаунта
              </DropdownMenuItem>
            </>
          ) : null}

          {!isSelf && isOwner ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="gap-2">
                  <UserCog className="h-4 w-4" />
                  Изменить роль
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="glass-strong border-white/10">
                  <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                    Выберите должность в админке
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/users?q=${user.username}`}>Открыть в админке</Link>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-destructive"
                onSelect={() => setDeleteAccountOpen(true)}
              >
                <UserX className="h-4 w-4" />
                Удалить аккаунт
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <MuteDurationSelect
        open={muteOpen}
        onOpenChange={setMuteOpen}
        username={user.username}
        onConfirm={async ({ duration, reason }) => {
          await run(
            () =>
              api.post(`/moderation/users/${user.id}/mute`, {
                duration,
                reason,
              }),
            'Пользователь замучен',
          );
          setMuteOpen(false);
        }}
      />

      <WarnDialog
        open={warnOpen}
        onOpenChange={setWarnOpen}
        username={user.username}
        onConfirm={async (reason) => {
          await run(
            () => api.post(`/moderation/users/${user.id}/warn`, { reason }),
            'Предупреждение отправлено',
          );
          setWarnOpen(false);
        }}
      />

      <BanDialog
        open={banOpen}
        onOpenChange={setBanOpen}
        username={user.username}
        allowPermanent={isAdmin}
        allowIp={isAdmin}
        onConfirm={async (payload) => {
          await run(
            () => api.post(`/moderation/users/${user.id}/ban`, payload),
            'Пользователь забанен',
          );
          setBanOpen(false);
        }}
      />

      <Dialog open={hardDeleteOpen} onOpenChange={setHardDeleteOpen}>
        <DialogContent className="glass-strong border-white/10">
          <DialogHeader>
            <DialogTitle>Полное удаление</DialogTitle>
            <DialogDescription>
              Контент будет удалён без следа. Укажите причину для аудита.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={hardDeleteReason}
            onChange={(e) => setHardDeleteReason(e.target.value)}
            placeholder="Причина"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setHardDeleteOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              disabled={busy || hardDeleteReason.trim().length < 2}
              onClick={() => {
                void run(async () => {
                  if (messageId) {
                    await api.post(`/moderation/messages/${messageId}/hard-delete`, {
                      reason: hardDeleteReason,
                    });
                  } else if (commentId) {
                    await api.post(`/moderation/comments/${commentId}/hard-delete`, {
                      reason: hardDeleteReason,
                    });
                  }
                }, 'Удалено').then(() => {
                  setHardDeleteOpen(false);
                  setHardDeleteReason('');
                });
              }}
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
        <DialogContent className="glass-strong border-white/10">
          <DialogHeader>
            <DialogTitle>Удалить аккаунт {user.username}?</DialogTitle>
            <DialogDescription>
              Это действие необратимо. Аккаунт будет деактивирован.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteAccountOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => {
                void run(() => api.delete(`/admin/users/${user.id}`), 'Аккаунт удалён').then(() =>
                  setDeleteAccountOpen(false),
                );
              }}
            >
              Удалить навсегда
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
