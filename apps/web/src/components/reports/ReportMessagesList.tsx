'use client';

import type { ReportMessage as ReportMessageType, RoleGroup } from '@twomc/shared';
import { RoleGroup as RG, hasRoleGroup } from '@twomc/shared';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { FileText, Pin, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AvatarWithSkin } from '@/components/shared/AvatarWithSkin';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  useDeleteOwnReportMessage,
  useHardDeleteReportMessage,
  usePinReportMessage,
  useSoftDeleteReportMessage,
} from '@/hooks/reports/useReports';
import { extractErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

const OWN_DELETE_WINDOW_MS = 5 * 60 * 1000;

function MessageCard({
  message,
  reportNumber,
  currentUserId,
  roleGroup,
  showPin,
}: {
  message: ReportMessageType;
  reportNumber: string;
  currentUserId?: string;
  roleGroup?: RoleGroup;
  showPin?: boolean;
}) {
  const softDelete = useSoftDeleteReportMessage();
  const hardDelete = useHardDeleteReportMessage();
  const ownDelete = useDeleteOwnReportMessage(reportNumber);
  const pin = usePinReportMessage();

  const isStaffViewer = roleGroup ? hasRoleGroup(roleGroup, RG.HELPER) : false;
  const isAdmin = roleGroup ? hasRoleGroup(roleGroup, RG.ADMIN) : false;
  const isAuthor = currentUserId === message.author.id;
  const canOwnDelete =
    isAuthor &&
    !message.isSystem &&
    !message.isDeleted &&
    Date.now() - new Date(message.createdAt).getTime() <= OWN_DELETE_WINDOW_MS;

  if (message.isSystem) {
    return (
      <div className="rounded-lg bg-white/5 px-4 py-2 text-center text-sm text-neutral-400">
        {message.content}
        <span className="ml-2 text-xs opacity-70">
          {format(new Date(message.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
        </span>
      </div>
    );
  }

  return (
    <article className="group rounded-xl glass-light p-4 transition hover:bg-white/[0.04]">
      <div className="mb-3 flex flex-wrap items-start gap-2">
        <AvatarWithSkin user={message.author} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ColoredUsername user={message.author} size="sm" />
            {message.isStaff ? (
              <Badge variant="secondary" className="text-[10px]">
                Модератор
              </Badge>
            ) : null}
            {message.isPinned ? (
              <Badge className="bg-white/10 text-[10px] text-neutral-200">
                <Pin className="mr-1 h-3 w-3" />
                Закреплено
              </Badge>
            ) : null}
            <span className="text-xs text-muted-foreground">
              {format(new Date(message.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
            </span>
          </div>
        </div>

        {!message.isDeleted && (isStaffViewer || canOwnDelete) ? (
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {isStaffViewer && showPin !== false ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                title={message.isPinned ? 'Открепить' : 'Закрепить'}
                onClick={() =>
                  void pin
                    .mutateAsync({
                      reportNumber,
                      messageId: message.id,
                      pin: !message.isPinned,
                    })
                    .then(() => toast.success(message.isPinned ? 'Откреплено' : 'Закреплено'))
                    .catch((error) => toast.error(extractErrorMessage(error)))
                }
              >
                <Pin className={cn('h-4 w-4', message.isPinned && 'text-white')} />
              </Button>
            ) : null}
            {isStaffViewer ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                title="Удалить"
                onClick={() =>
                  void softDelete
                    .mutateAsync({ reportNumber, messageId: message.id })
                    .then(() => toast.success('Сообщение удалено'))
                    .catch((error) => toast.error(extractErrorMessage(error)))
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
            {isAdmin ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-red-400"
                title="Удалить полностью"
                onClick={() => {
                  if (!window.confirm('Удалить сообщение без следа?')) return;
                  void hardDelete
                    .mutateAsync({ reportNumber, messageId: message.id })
                    .then(() => toast.success('Сообщение удалено полностью'))
                    .catch((error) => toast.error(extractErrorMessage(error)));
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
            {canOwnDelete && !isStaffViewer ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                title="Удалить своё сообщение"
                onClick={() =>
                  void ownDelete
                    .mutateAsync(message.id)
                    .then(() => toast.success('Сообщение удалено'))
                    .catch((error) => toast.error(extractErrorMessage(error)))
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {message.isDeleted ? (
        <p className="text-sm italic text-muted-foreground">[Сообщение удалено модератором]</p>
      ) : message.contentHtml ? (
        <div
          className="prose prose-invert max-w-none text-sm"
          dangerouslySetInnerHTML={{ __html: message.contentHtml }}
        />
      ) : (
        <p className="whitespace-pre-wrap text-sm text-neutral-200">{message.content}</p>
      )}

      {!message.isDeleted && message.attachments?.length ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-white/5 pt-3">
          {message.attachments.map((file) =>
            file.mimeType.startsWith('image/') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <a
                key={file.id}
                href={file.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-lg glass-light"
              >
                <img src={file.fileUrl} alt={file.fileName} className="h-24 w-24 object-cover" />
              </a>
            ) : (
              <a
                key={file.id}
                href={file.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg glass-light px-3 py-2 text-xs text-neutral-200 transition hover:opacity-80"
              >
                <FileText className="h-4 w-4 shrink-0" />
                {file.fileName}
              </a>
            ),
          )}
        </div>
      ) : null}
    </article>
  );
}

export function ReportMessagesList({
  messages,
  reportNumber,
  currentUserId,
  roleGroup,
  className,
}: {
  messages: ReportMessageType[];
  reportNumber: string;
  currentUserId?: string;
  roleGroup?: RoleGroup;
  authorId?: string;
  className?: string;
}) {
  if (messages.length === 0) {
    return <p className={cn('text-sm text-muted-foreground', className)}>Сообщений пока нет</p>;
  }

  const pinned = messages.filter((m) => m.isPinned && !m.isSystem);
  const rest = messages.filter((m) => !m.isPinned || m.isSystem);

  const render = (list: ReportMessageType[]) =>
    list.map((message) => (
      <MessageCard
        key={message.id}
        message={message}
        reportNumber={reportNumber}
        currentUserId={currentUserId}
        roleGroup={roleGroup}
        showPin={!message.isSystem}
      />
    ));

  return (
    <div className={cn('space-y-3', className)}>
      {pinned.length > 0 ? (
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Pin className="h-3.5 w-3.5" />
            Закреплённые
          </p>
          {render(pinned)}
          <div className="border-b border-white/10" />
        </div>
      ) : null}
      {render(rest)}
    </div>
  );
}
