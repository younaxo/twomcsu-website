'use client';

import { ReportType } from '@twomc/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { CaptchaField, type CaptchaFieldHandle } from '@/components/shared/CaptchaField';
import {
  EvidenceLinksInput,
  getValidEvidenceLinks,
  type EvidenceLinkDraft,
} from '@/components/reports/EvidenceLinksInput';
import { FileUploadZone } from '@/components/reports/FileUploadZone';
import { PunishmentSelector } from '@/components/reports/PunishmentSelector';
import { ReportRulesCard } from '@/components/reports/ReportRulesCard';
import { TargetsInput, type TargetDraft } from '@/components/reports/TargetsInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useServers } from '@/hooks/servers';
import {
  useCreateReport,
  useReportRules,
  type CreateReportPayload,
} from '@/hooks/reports/useReports';
import { api, extractErrorMessage } from '@/lib/api';

type FormValues = {
  captchaToken: string;
};

export function ReportForm({ type }: { type: Exclude<ReportType, 'DONATION_PROBLEM'> }) {
  const router = useRouter();
  const rules = useReportRules(type);
  const servers = useServers();
  const createReport = useCreateReport();
  const captchaRef = useRef<CaptchaFieldHandle>(null);
  const form = useForm<FormValues>({ defaultValues: { captchaToken: '' } });

  const [step, setStep] = useState<1 | 2>(1);
  const [agreed, setAgreed] = useState(false);
  const [targets, setTargets] = useState<TargetDraft[]>([]);
  const [appealedPunishmentId, setAppealedPunishmentId] = useState<string | null>(null);
  const [server, setServer] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentTime, setIncidentTime] = useState('');
  const [description, setDescription] = useState('');
  const [additionalText, setAdditionalText] = useState('');
  const [evidenceLinks, setEvidenceLinks] = useState<EvidenceLinkDraft[]>([{ url: '', title: '' }]);
  const [files, setFiles] = useState<File[]>([]);

  const needsTarget =
    type === ReportType.PLAYER_COMPLAINT || type === ReportType.ADMIN_COMPLAINT;
  const needsServer = type === ReportType.PLAYER_COMPLAINT;
  const needsIncident = type === ReportType.PLAYER_COMPLAINT;
  const needsEvidence =
    type === ReportType.PLAYER_COMPLAINT ||
    type === ReportType.ADMIN_COMPLAINT ||
    type === ReportType.PUNISHMENT_APPEAL;
  const isAppeal = type === ReportType.PUNISHMENT_APPEAL;

  const validLinks = useMemo(() => getValidEvidenceLinks(evidenceLinks), [evidenceLinks]);

  const submit = form.handleSubmit(async ({ captchaToken }) => {
    if (description.trim().length < 20) {
      toast.error('Описание должно содержать минимум 20 символов');
      return;
    }
    if (needsTarget && targets.length < 1) {
      toast.error('Укажите хотя бы одного игрока');
      return;
    }
    if (isAppeal && !appealedPunishmentId) {
      toast.error('Выберите наказание для обжалования');
      return;
    }
    if (needsServer && !server) {
      toast.error('Выберите сервер');
      return;
    }
    if (needsEvidence && validLinks.length < 1) {
      toast.error('Добавьте хотя бы одну ссылку на доказательства');
      return;
    }
    if (!captchaToken) {
      toast.error('Пройдите капчу');
      return;
    }

    let incidentIso: string | undefined;
    if (incidentDate) {
      const combined = `${incidentDate}T${incidentTime || '00:00'}:00`;
      const parsed = new Date(combined);
      if (Number.isNaN(parsed.getTime())) {
        toast.error('Некорректная дата');
        return;
      }
      if (needsIncident) {
        if (parsed.getTime() > Date.now()) {
          toast.error('Дата не может быть в будущем');
          return;
        }
        const age = Date.now() - parsed.getTime();
        if (age > 72 * 60 * 60 * 1000) {
          toast.error('Жалобу можно подать только в течение 72 часов');
          return;
        }
      }
      incidentIso = parsed.toISOString();
    }

    const payload: CreateReportPayload = {
      type,
      description: description.trim(),
      captchaToken,
    };

    if (needsTarget) {
      payload.targets = targets.map((target, order) => ({
        username: target.username,
        order,
      }));
    }

    if (validLinks.length > 0) {
      payload.evidenceLinks = validLinks.map((link, order) => ({
        url: link.url,
        title: link.title || undefined,
        order,
      }));
    }

    if (server) payload.server = server;
    if (incidentIso) payload.incidentDate = incidentIso;
    if (additionalText.trim()) payload.additionalText = additionalText.trim();
    if (appealedPunishmentId) payload.appealedPunishmentId = appealedPunishmentId;

    try {
      const report = await createReport.mutateAsync(payload);

      if (files.length > 0) {
        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);
          await api.post(`/reports/${report.reportNumber}/attachments`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      }

      toast.success(`Обращение ${report.reportNumber} создано`);
      router.push(`/report/${report.reportNumber}`);
    } catch (error) {
      captchaRef.current?.reset();
      toast.error(extractErrorMessage(error, 'Не удалось создать обращение'));
    }
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Создать обращение</h1>
        <p className="text-sm text-muted-foreground">Шаг {step} из 2</p>
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <ReportRulesCard
            topic={rules.data}
            isLoading={rules.isLoading}
            agreed={agreed}
            onAgreedChange={setAgreed}
          />
          <div className="flex justify-end gap-2">
            <Button asChild variant="ghost">
              <Link href="/report/new">Назад</Link>
            </Button>
            <Button
              type="button"
              disabled={!agreed}
              onClick={() => setStep(2)}
              className="bg-[#F57C00] text-black hover:bg-[#F57C00]/90"
            >
              Далее
            </Button>
          </div>
        </div>
      ) : (
        <FormProvider {...form}>
          <form onSubmit={submit} className="space-y-5 rounded-2xl glass-strong p-5">
            {isAppeal ? (
              <div className="space-y-2">
                <Label>Наказание для обжалования *</Label>
                <PunishmentSelector
                  value={appealedPunishmentId}
                  onChange={setAppealedPunishmentId}
                />
              </div>
            ) : null}

            {needsTarget ? (
              <TargetsInput
                value={targets}
                onChange={setTargets}
                label={
                  type === ReportType.ADMIN_COMPLAINT
                    ? 'Ник администратора / хелпера *'
                    : 'Ник нарушителя *'
                }
              />
            ) : null}

            {(needsServer ||
              type === ReportType.ADMIN_COMPLAINT ||
              type === ReportType.TECHNICAL_ISSUE) && (
              <div className="space-y-2">
                <Label>Сервер{needsServer ? ' *' : ''}</Label>
                <Select value={server} onValueChange={setServer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите сервер" />
                  </SelectTrigger>
                  <SelectContent>
                    {(servers.data ?? []).map((item) => (
                      <SelectItem key={item.slug} value={item.slug}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(needsIncident ||
              type === ReportType.ADMIN_COMPLAINT ||
              type === ReportType.PUNISHMENT_APPEAL) && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Дата{needsIncident ? ' *' : ''}</Label>
                  <Input
                    type="date"
                    value={incidentDate}
                    onChange={(event) => setIncidentDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Время</Label>
                  <Input
                    type="time"
                    value={incidentTime}
                    onChange={(event) => setIncidentTime(event.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Описание проблемы *</Label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={6}
                placeholder="Опишите ситуацию подробно (поддерживается markdown)"
              />
              <p className="text-xs text-muted-foreground">{description.length} / мин. 20</p>
            </div>

            <div className="space-y-2">
              <Label>Дополнительная информация</Label>
              <Textarea
                value={additionalText}
                onChange={(event) => setAdditionalText(event.target.value)}
                rows={3}
                placeholder="Любые дополнительные детали (необязательно)"
              />
            </div>

            {(needsEvidence || type === ReportType.TECHNICAL_ISSUE) && (
              <EvidenceLinksInput
                value={evidenceLinks}
                onChange={setEvidenceLinks}
                label="Доказательства"
                required={needsEvidence}
                hint={
                  type === ReportType.PLAYER_COMPLAINT
                    ? 'Скриншоты не являются доказательством, но могут быть приложены как дополнение к ссылкам на видео'
                    : undefined
                }
              />
            )}

            <div className="space-y-2">
              <Label>Дополнительные файлы</Label>
              <FileUploadZone
                files={files}
                onChange={setFiles}
                hint="jpg, png, webp, pdf, mp4, doc, docx, txt · до 10 файлов"
              />
            </div>

            <CaptchaField ref={captchaRef} />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                Назад
              </Button>
              <Button asChild variant="ghost">
                <Link href="/report">Отмена</Link>
              </Button>
              <Button
                type="submit"
                disabled={createReport.isPending}
                className="bg-[#F57C00] text-black hover:bg-[#F57C00]/90"
              >
                Отправить обращение
              </Button>
            </div>
          </form>
        </FormProvider>
      )}
    </div>
  );
}
