'use client';

import {
  REPORT_STATUS_LABELS,
  ReportDetails,
  ReportStatus,
  RoleGroup,
  hasRoleGroup,
} from '@twomc/shared';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { VerdictDialog } from '@/components/reports/VerdictDialog';
import {
  useArchiveReport,
  useAssignReport,
  useChangeReportStatus,
  useDeleteReport,
  useLockReport,
} from '@/hooks/reports/useReports';
import { extractErrorMessage } from '@/lib/api';

export function ReportModerationActions({
  report,
  roleGroup,
}: {
  report: ReportDetails;
  roleGroup: RoleGroup;
}) {
  const assign = useAssignReport();
  const changeStatus = useChangeReportStatus();
  const lock = useLockReport();
  const archive = useArchiveReport();
  const deleteReport = useDeleteReport();

  const [verdictOpen, setVerdictOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ReportStatus | ''>('');
  const [statusComment, setStatusComment] = useState('');
  const [lockOpen, setLockOpen] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isAdmin = hasRoleGroup(roleGroup, RoleGroup.ADMIN);

  const take = async () => {
    try {
      await assign.mutateAsync({ reportNumber: report.reportNumber });
      toast.success('Обращение назначено вам');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось взять обращение'));
    }
  };

  const confirmStatus = async () => {
    if (!pendingStatus) return;
    try {
      await changeStatus.mutateAsync({
        reportNumber: report.reportNumber,
        status: pendingStatus,
        comment: statusComment.trim() || undefined,
      });
      toast.success('Статус обновлён');
      setStatusOpen(false);
      setPendingStatus('');
      setStatusComment('');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось изменить статус'));
    }
  };

  const confirmLock = async () => {
    if (lockReason.trim().length < 3) {
      toast.error('Укажите причину блокировки');
      return;
    }
    try {
      await lock.mutateAsync({ reportNumber: report.reportNumber, reason: lockReason.trim() });
      toast.success('Сообщения заблокированы');
      setLockOpen(false);
      setLockReason('');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось заблокировать сообщения'));
    }
  };

  const confirmArchive = async () => {
    try {
      await archive.mutateAsync({
        reportNumber: report.reportNumber,
        reason: archiveReason.trim() || undefined,
      });
      toast.success('Обращение архивировано');
      setArchiveOpen(false);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось архивировать'));
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteReport.mutateAsync(report.reportNumber);
      toast.success('Обращение удалено');
      setDeleteOpen(false);
      window.location.assign('/moderation/reports');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось удалить обращение'));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {!report.assignedTo ? (
        <Button
          type="button"
          size="sm"
          onClick={() => void take()}
          disabled={assign.isPending}
          className="bg-[#F57C00] text-black hover:bg-[#E65100]"
        >
          Взять себе
        </Button>
      ) : null}

      <Select
        value=""
        onValueChange={(value) => {
          setPendingStatus(value as ReportStatus);
          setStatusOpen(true);
        }}
      >
        <SelectTrigger className="h-9 w-full glass-light">
          <SelectValue placeholder="Изменить статус" />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(REPORT_STATUS_LABELS) as ReportStatus[]).map((status) => (
            <SelectItem key={status} value={status} disabled={status === report.status}>
              {REPORT_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button type="button" size="sm" variant="secondary" onClick={() => setVerdictOpen(true)}>
        Вынести вердикт
      </Button>

      {isAdmin && !report.isLocked ? (
        <Button type="button" size="sm" variant="secondary" onClick={() => setLockOpen(true)}>
          Заблокировать сообщения
        </Button>
      ) : null}

      {isAdmin ? (
        <>
          <Button type="button" size="sm" variant="secondary" onClick={() => setArchiveOpen(true)}>
            Архивировать
          </Button>
          <Button type="button" size="sm" variant="destructive" onClick={() => setDeleteOpen(true)}>
            Удалить
          </Button>
        </>
      ) : null}

      <VerdictDialog
        reportNumber={report.reportNumber}
        open={verdictOpen}
        onOpenChange={setVerdictOpen}
        onStatusReminder={() => {
          setPendingStatus(ReportStatus.RESOLVED);
          setStatusOpen(true);
        }}
      />

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="glass-strong border-white/10">
          <DialogHeader>
            <DialogTitle>Изменить статус</DialogTitle>
            <DialogDescription>
              {pendingStatus
                ? `С «${REPORT_STATUS_LABELS[report.status]}» на «${REPORT_STATUS_LABELS[pendingStatus]}»`
                : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Комментарий (необязательно)</Label>
            <Textarea
              value={statusComment}
              onChange={(e) => setStatusComment(e.target.value)}
              rows={3}
              placeholder="Причина смены статуса..."
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setStatusOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => void confirmStatus()}
              disabled={changeStatus.isPending || !pendingStatus}
              className="bg-[#F57C00] text-black hover:bg-[#E65100]"
            >
              Подтвердить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lockOpen} onOpenChange={setLockOpen}>
        <DialogContent className="glass-strong border-white/10">
          <DialogHeader>
            <DialogTitle>Заблокировать сообщения</DialogTitle>
            <DialogDescription>
              После блокировки автор и обвиняемые не смогут отправлять новые сообщения в это
              обращение
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Причина блокировки</Label>
            <Textarea
              value={lockReason}
              onChange={(e) => setLockReason(e.target.value)}
              rows={3}
              placeholder="Укажите причину..."
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLockOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={() => void confirmLock()} disabled={lock.isPending}>
              Заблокировать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent className="glass-strong border-white/10">
          <DialogHeader>
            <DialogTitle>Архивировать обращение</DialogTitle>
            <DialogDescription>
              Обращение исчезнет из обычных списков и будет доступно в архиве
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Причина (необязательно)</Label>
            <Textarea
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setArchiveOpen(false)}>
              Отмена
            </Button>
            <Button onClick={() => void confirmArchive()} disabled={archive.isPending}>
              Архивировать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="glass-strong border-white/10">
          <DialogHeader>
            <DialogTitle>Удалить обращение</DialogTitle>
            <DialogDescription>
              Полное удаление {report.reportNumber} и всех связанных данных. Это действие нельзя
              отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={() => void confirmDelete()}
              disabled={deleteReport.isPending}
            >
              Удалить навсегда
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
