'use client';

import { ReportType } from '@twomc/shared';
import type { UserSearchResult } from '@twomc/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { CaptchaField, type CaptchaFieldHandle } from '@/components/shared/CaptchaField';
import { UserSearchInput } from '@/components/shared/UserSearchInput';
import { FileUploadZone } from '@/components/reports/FileUploadZone';
import { ReportRulesCard } from '@/components/reports/ReportRulesCard';
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
  const [target, setTarget] = useState<UserSearchResult | null>(null);
  const [server, setServer] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentTime, setIncidentTime] = useState('');
  const [description, setDescription] = useState('');
  const [links, setLinks] = useState<string[]>(['']);
  const [files, setFiles] = useState<File[]>([]);

  const needsTarget =
    type === ReportType.PLAYER_COMPLAINT || type === ReportType.ADMIN_COMPLAINT;
  const needsServer = type === ReportType.PLAYER_COMPLAINT;
  const needsIncident = type === ReportType.PLAYER_COMPLAINT;
  const needsEvidence =
    type === ReportType.PLAYER_COMPLAINT ||
    type === ReportType.ADMIN_COMPLAINT ||
    type === ReportType.PUNISHMENT_APPEAL;

  const validLinks = useMemo(
    () => links.map((link) => link.trim()).filter(Boolean),
    [links],
  );

  const submit = form.handleSubmit(async ({ captchaToken }) => {
    if (description.trim().length < 20) {
      toast.error('Описание должно содержать минимум 20 символов');
      return;
    }
    if (needsTarget && !target) {
      toast.error('Укажите игрока');
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
        const age = Date.now() - parsed.getTime();
        if (parsed.getTime() > Date.now()) {
          toast.error('Дата не может быть в будущем');
          return;
        }
        if (age > 72 * 60 * 60 * 1000) {
          toast.error('Жалобу можно подать только в течение 72 часов');
          return;
        }
      }
      incidentIso = parsed.toISOString();
    }

    try {
      const report = await createReport.mutateAsync({
        type,
        targetUsername: target?.username,
        server: server || undefined,
        incidentDate: incidentIso,
        description: description.trim(),
        evidenceLinks: validLinks,
        captchaToken,
      });

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
            {needsTarget ? (
              <div className="space-y-2">
                <Label>
                  {type === ReportType.ADMIN_COMPLAINT
                    ? 'Ник администратора / хелпера *'
                    : 'Ник нарушителя *'}
                </Label>
                {target ? (
                  <div className="flex items-center justify-between rounded-lg glass-light px-3 py-2">
                    <span className="text-sm text-white">{target.username}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setTarget(null)}>
                      Изменить
                    </Button>
                  </div>
                ) : (
                  <UserSearchInput onSelect={setTarget} />
                )}
              </div>
            ) : null}

            {(needsServer ||
              type === ReportType.ADMIN_COMPLAINT ||
              type === ReportType.TECHNICAL_ISSUE) && (
              <div className="space-y-2">
                <Label>
                  Сервер{needsServer ? ' *' : ''}
                </Label>
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
                  <Label>
                    Дата{needsIncident ? ' *' : ''}
                  </Label>
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

            {(needsEvidence || type === ReportType.TECHNICAL_ISSUE) && (
              <div className="space-y-3">
                <Label>Доказательства{needsEvidence ? ' *' : ''}</Label>
                {type === ReportType.PLAYER_COMPLAINT ? (
                  <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                    Скриншоты не являются доказательством, но могут быть приложены как дополнение к
                    ссылкам на видео
                  </p>
                ) : null}
                {links.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={link}
                      onChange={(event) => {
                        const next = [...links];
                        next[index] = event.target.value;
                        setLinks(next);
                      }}
                      placeholder="https://..."
                    />
                    {links.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setLinks(links.filter((_, i) => i !== index))}
                      >
                        Удалить
                      </Button>
                    ) : null}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setLinks([...links, ''])}
                >
                  + Добавить ссылку
                </Button>
              </div>
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
