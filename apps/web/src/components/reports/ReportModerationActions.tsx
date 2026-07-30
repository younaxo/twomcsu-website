'use client';

import {
  REPORT_STATUS_LABELS,
  ReportDetails,
  ReportStatus,
  ReportType,
  RoleGroup,
  hasRoleGroup,
} from '@twomc/shared';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PunishmentDialog } from '@/components/reports/PunishmentDialog';
import { VerdictDialog } from '@/components/reports/VerdictDialog';
import {
  useAssignReport,
  useChangeReportStatus,
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
  const [verdictOpen, setVerdictOpen] = useState(false);
  const [punishOpen, setPunishOpen] = useState(false);

  const take = async () => {
    try {
      await assign.mutateAsync({ reportNumber: report.reportNumber });
      toast.success('Обращение назначено вам');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось взять обращение'));
    }
  };

  const onStatus = async (status: ReportStatus) => {
    try {
      await changeStatus.mutateAsync({ reportNumber: report.reportNumber, status });
      toast.success('Статус обновлён');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось изменить статус'));
    }
  };

  const onLock = async () => {
    const reason = window.prompt('Причина блокировки обращения');
    if (!reason || reason.trim().length < 3) return;
    try {
      await lock.mutateAsync({ reportNumber: report.reportNumber, reason: reason.trim() });
      toast.success('Обращение заблокировано');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось заблокировать'));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!report.assignedTo ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              onClick={() => void take()}
              disabled={assign.isPending}
              className="bg-[#F57C00] text-black hover:bg-[#F57C00]/90"
            >
              Взять себе
            </Button>
          </TooltipTrigger>
          <TooltipContent>Назначить обращение на себя</TooltipContent>
        </Tooltip>
      ) : null}

      <Select onValueChange={(value) => void onStatus(value as ReportStatus)}>
        <SelectTrigger className="h-9 w-[180px] glass-light">
          <SelectValue placeholder="Изменить статус" />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(REPORT_STATUS_LABELS) as ReportStatus[]).map((status) => (
            <SelectItem key={status} value={status}>
              {REPORT_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button type="button" size="sm" variant="secondary" onClick={() => setVerdictOpen(true)}>
        Вынести вердикт
      </Button>

      {report.type === ReportType.PLAYER_COMPLAINT ? (
        <Button type="button" size="sm" variant="secondary" onClick={() => setPunishOpen(true)}>
          Выдать наказание
        </Button>
      ) : null}

      {hasRoleGroup(roleGroup, RoleGroup.ADMIN) && !report.isLocked ? (
        <Button type="button" size="sm" variant="destructive" onClick={() => void onLock()}>
          Заблокировать
        </Button>
      ) : null}

      <VerdictDialog
        reportNumber={report.reportNumber}
        open={verdictOpen}
        onOpenChange={setVerdictOpen}
      />
      <PunishmentDialog
        reportNumber={report.reportNumber}
        targets={report.targets}
        open={punishOpen}
        onOpenChange={setPunishOpen}
      />
    </div>
  );
}
