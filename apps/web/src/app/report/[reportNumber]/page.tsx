'use client';

import {
  PUNISHMENT_TYPE_LABELS,
  REPORT_TYPE_LABELS,
  canReviewReportType,
} from '@twomc/shared';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { FileText, Gavel, Users } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AvatarWithSkin } from '@/components/shared/AvatarWithSkin';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { EvidenceLinks } from '@/components/reports/EvidenceLinks';
import { ReportMessageInput } from '@/components/reports/ReportMessageInput';
import { ReportMessagesList } from '@/components/reports/ReportMessagesList';
import { ReportModerationActions } from '@/components/reports/ReportModerationActions';
import { ReportStatusBadge } from '@/components/reports/ReportStatusBadge';
import { ReportTimeline } from '@/components/reports/ReportTimeline';
import { ReportTypeIcon } from '@/components/reports/ReportTypeIcon';
import { TargetChip } from '@/components/reports/TargetChip';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useReport } from '@/hooks/reports/useReports';
import { resolveMediaUrl } from '@/lib/profile';

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
  const isModerator = canReviewReportType(user.roleGroup, data.type);
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

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header className="space-y-4 rounded-2xl glass-strong p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-2xl font-semibold text-[#F57C00]">{data.reportNumber}</p>
            <div className="flex flex-wrap items-center gap-2">
              <ReportTypeIcon type={data.type} showLabel />
              <ReportStatusBadge status={data.status} />
              <span className="text-sm text-muted-foreground">
                {format(new Date(data.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                {' · '}
                {formatDistanceToNow(new Date(data.createdAt), { addSuffix: true, locale: ru })}
              </span>
            </div>
            <p className="text-sm text-neutral-400">{REPORT_TYPE_LABELS[data.type]}</p>
          </div>
          {isModerator ? (
            <ReportModerationActions report={data} roleGroup={user.roleGroup} />
          ) : null}
        </div>

        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Автор:</span>
            <AvatarWithSkin user={data.author} size="sm" />
            <ColoredUsername user={data.author} size="sm" />
          </div>
          {data.assignedTo ? (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Модератор:</span>
              <AvatarWithSkin user={data.assignedTo} size="sm" />
              <ColoredUsername user={data.assignedTo} size="sm" />
            </div>
          ) : null}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          {targets.length > 0 ? (
            <section className="rounded-2xl glass-medium p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Users className="h-4 w-4" />
                Участники обращения
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
                {data.appealedPunishment.server ? (
                  <div>
                    <dt className="text-muted-foreground">Сервер</dt>
                    <dd className="text-white">{data.appealedPunishment.server}</dd>
                  </div>
                ) : null}
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Причина</dt>
                  <dd className="whitespace-pre-wrap text-white">{data.appealedPunishment.reason}</dd>
                </div>
                {data.appealedPunishment.issuedByUser ? (
                  <div>
                    <dt className="text-muted-foreground">Выдал</dt>
                    <dd>
                      <ColoredUsername user={data.appealedPunishment.issuedByUser} size="sm" />
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-muted-foreground">Дата</dt>
                  <dd className="text-white">
                    {format(new Date(data.appealedPunishment.issuedAt), 'dd.MM.yyyy HH:mm', {
                      locale: ru,
                    })}
                  </dd>
                </div>
              </dl>
            </section>
          ) : null}

          <section className="rounded-2xl glass-medium p-5">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">Описание</h2>
            {data.descriptionHtml ? (
              <div
                className="prose prose-invert max-w-none text-sm"
                dangerouslySetInnerHTML={{ __html: data.descriptionHtml }}
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm text-neutral-200">{data.description}</p>
            )}
          </section>

          {data.additionalText ? (
            <section className="rounded-2xl glass-medium p-5">
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                Дополнительная информация
              </h2>
              <p className="whitespace-pre-wrap text-sm text-neutral-200">{data.additionalText}</p>
            </section>
          ) : null}

          {data.evidenceLinks.length > 0 ? (
            <section className="rounded-2xl glass-medium p-5">
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">Доказательства</h2>
              <EvidenceLinks links={data.evidenceLinks} />
            </section>
          ) : null}

          {data.attachments.length > 0 ? (
            <section className="rounded-2xl glass-medium p-5">
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">Файлы</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {data.attachments.map((file) => {
                  const url = resolveMediaUrl(file.fileUrl) ?? file.fileUrl;
                  const isImage = file.mimeType.startsWith('image/');
                  return (
                    <a
                      key={file.id}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl glass-light p-3 hover:bg-white/10"
                    >
                      {isImage ? (
                        <Image
                          src={url}
                          alt={file.fileName}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded object-cover"
                          unoptimized
                        />
                      ) : (
                        <FileText className="h-10 w-10 text-red-400" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm text-white">{file.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.fileSize / 1024).toFixed(0)} КБ
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>
          ) : null}

          {data.verdict ? (
            <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
              <h2 className="mb-3 text-sm font-medium text-emerald-300">Вердикт</h2>
              {data.verdictHtml ? (
                <div
                  className="prose prose-invert max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: data.verdictHtml }}
                />
              ) : (
                <p className="whitespace-pre-wrap text-sm">{data.verdict}</p>
              )}
            </section>
          ) : null}
        </div>

        <aside className="rounded-2xl glass-medium p-5">
          <ReportTimeline report={data} />
        </aside>
      </div>

      <section className="space-y-4 rounded-2xl glass-medium p-5">
        <h2 className="text-lg font-medium text-white">Переписка</h2>
        <ReportMessagesList messages={data.messages} />
        <ReportMessageInput
          reportNumber={data.reportNumber}
          isLocked={data.isLocked}
          canInternal={isModerator}
        />
      </section>
    </div>
  );
}
