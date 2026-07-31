'use client';

import {
  PUNISHMENT_TYPE_LABELS,
  REPORT_TYPE_LABELS,
  canReviewReportType,
} from '@twomc/shared';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ArrowLeft, CheckCircle2, Gavel, Users, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AvatarWithSkin } from '@/components/shared/AvatarWithSkin';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { ReportMessageInput } from '@/components/reports/ReportMessageInput';
import { ReportMessagesList } from '@/components/reports/ReportMessagesList';
import { ReportModeratorNotes } from '@/components/reports/ReportModeratorNotes';
import { ReportModerationActions } from '@/components/reports/ReportModerationActions';
import { ReportNumberBadge } from '@/components/reports/ReportNumberBadge';
import { ReportStatusBadge } from '@/components/reports/ReportStatusBadge';
import { ReportTypeIcon } from '@/components/reports/ReportTypeIcon';
import { TargetChip } from '@/components/reports/TargetChip';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useReport } from '@/hooks/reports/useReports';
import { cn } from '@/lib/utils';

export default function ReportDetailsPage() {
  const params = useParams<{ reportNumber: string }>();
  const reportNumber = params.reportNumber;
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const report = useReport(reportNumber, isAuthenticated);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated || report.isLoading) {
    return <Skeleton className="mx-auto mt-10 h-[70vh] max-w-6xl rounded-2xl" />;
  }

  if (report.isError || !report.data || !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">
        Обращение не найдено или недоступно
      </div>
    );
  }

  const data = report.data;
  const isTarget = data.targets.some((target) => target.userId === user.id);
  const canModerateType = canReviewReportType(user.roleGroup, data.type);
  const isModerator = canModerateType && !isTarget;
  const targets =
    data.targets.length > 0
      ? data.targets
      : data.targetUsername
        ? [
            {
              id: data.targetUsername,
              username: data.targetUsername,
              userId: data.targetUserId,
              user: null,
              order: 0,
              createdAt: data.createdAt,
            },
          ]
        : [];

  const backHref = canModerateType ? '/moderation/reports' : '/report';
  const isRejected = data.status === 'REJECTED';
  const hasVerdict = Boolean(data.verdict);

  // Original description as first timeline entry, then thread replies
  const threadMessages = [
    {
      id: `desc-${data.id}`,
      content: data.description,
      contentHtml: data.descriptionHtml,
      isStaff: false,
      isSystem: false,
      isDeleted: false,
      isPinned: false,
      pinnedAt: null,
      createdAt: data.createdAt,
      author: data.author,
    },
    ...data.messages,
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 pb-10 pt-4">
      <header className="sticky top-16 z-20 -mx-4 border-b border-white/5 glass-strong px-4 py-3 md:mx-0 md:rounded-2xl md:border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="shrink-0">
            <Link href={backHref}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Назад
            </Link>
          </Button>
          <div className="flex flex-1 justify-center">
            <ReportNumberBadge
              reportNumber={data.reportNumber}
              className="text-base font-semibold"
            />
          </div>
          <ReportStatusBadge status={data.status} className="shrink-0" />
        </div>
      </header>

      <div
        className={cn(
          'grid grid-cols-1 gap-6',
          isModerator && 'lg:grid-cols-[minmax(0,1fr)_320px]',
        )}
      >
        <div className="min-w-0 space-y-5">
          {canModerateType && isTarget ? (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Это обращение на вас. Рассматривать будет другой администратор
            </div>
          ) : null}

          <section className="rounded-2xl glass-medium p-5">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <ReportTypeIcon type={data.type} size="xl" />
              <div>
                <h1 className="text-xl font-semibold text-white">{REPORT_TYPE_LABELS[data.type]}</h1>
                <p className="text-sm text-muted-foreground">Основная информация</p>
              </div>
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="flex items-center gap-2 sm:col-span-2">
                <dt className="text-muted-foreground">Автор:</dt>
                <dd className="flex items-center gap-2">
                  <AvatarWithSkin user={data.author} size="sm" />
                  <ColoredUsername user={data.author} size="sm" />
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Создано</dt>
                <dd className="text-white">
                  {format(new Date(data.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Обновлено</dt>
                <dd className="text-white">
                  {format(new Date(data.updatedAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                </dd>
              </div>
              {data.incidentDate ? (
                <div>
                  <dt className="text-muted-foreground">Инцидент</dt>
                  <dd className="text-white">
                    {format(new Date(data.incidentDate), 'dd.MM.yyyy HH:mm', { locale: ru })}
                  </dd>
                </div>
              ) : null}
              {data.server ? (
                <div>
                  <dt className="text-muted-foreground">Сервер</dt>
                  <dd className="text-white">{data.server}</dd>
                </div>
              ) : null}
              {data.assignedTo ? (
                <div className="flex items-center gap-2 sm:col-span-2">
                  <dt className="text-muted-foreground">Модератор:</dt>
                  <dd className="flex items-center gap-2">
                    <AvatarWithSkin user={data.assignedTo} size="sm" />
                    <ColoredUsername user={data.assignedTo} size="sm" />
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          {targets.length > 0 ? (
            <section className="rounded-2xl glass-medium p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Users className="h-4 w-4" />
                Обвиняемые
              </h2>
              <div className="flex flex-wrap gap-2">
                {targets.map((target) => (
                  <TargetChip key={target.id} target={target} />
                ))}
              </div>
            </section>
          ) : null}

          {data.appealedPunishment ? (
            <section className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-purple-200">
                <Gavel className="h-4 w-4" />
                Обжалуемое наказание
              </h2>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Тип</dt>
                  <dd className="font-medium text-white">
                    {PUNISHMENT_TYPE_LABELS[data.appealedPunishment.punishmentType]}
                  </dd>
                </div>
                {data.appealedPunishment.duration ? (
                  <div>
                    <dt className="text-muted-foreground">Длительность</dt>
                    <dd className="text-white">{data.appealedPunishment.duration}</dd>
                  </div>
                ) : null}
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Причина</dt>
                  <dd className="whitespace-pre-wrap text-white">{data.appealedPunishment.reason}</dd>
                </div>
              </dl>
            </section>
          ) : null}

          <section className="space-y-4 rounded-2xl glass-medium p-5">
            <h2 className="text-lg font-medium text-white">Переписка</h2>
            <ReportMessagesList
              messages={threadMessages}
              reportNumber={data.reportNumber}
              currentUserId={user.id}
              roleGroup={user.roleGroup}
              authorId={data.author.id}
              evidenceLinks={data.evidenceLinks}
              attachments={data.attachments}
            />

            {hasVerdict ? (
              <article
                className={cn(
                  'rounded-2xl glass-strong p-5 animate-in fade-in duration-500',
                  isRejected
                    ? 'border border-red-500/40'
                    : 'border border-emerald-500/40',
                )}
              >
                <div className="mb-3 flex items-center gap-2">
                  {isRejected ? (
                    <XCircle className="h-6 w-6 text-red-400" />
                  ) : (
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  )}
                  <h3 className="text-lg font-semibold text-white">Вердикт по обращению</h3>
                </div>
                {data.verdictHtml ? (
                  <div
                    className="prose prose-invert max-w-none text-sm"
                    dangerouslySetInnerHTML={{ __html: data.verdictHtml }}
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-sm text-neutral-100">{data.verdict}</p>
                )}
                {data.resolvedAt ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {format(new Date(data.resolvedAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                  </p>
                ) : null}
              </article>
            ) : null}

            <ReportMessageInput reportNumber={data.reportNumber} isLocked={data.isLocked} />
          </section>

          {isModerator ? (
            <ReportModeratorNotes
              reportNumber={data.reportNumber}
              notes={data.moderatorNotes ?? []}
              currentUserId={user.id}
              roleGroup={user.roleGroup}
            />
          ) : null}
        </div>

        {isModerator ? (
          <aside className="w-full min-w-0 lg:sticky lg:top-20 lg:h-fit">
            <div className="rounded-2xl glass-medium p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Действия
              </p>
              <ReportModerationActions report={data} roleGroup={user.roleGroup} />
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
