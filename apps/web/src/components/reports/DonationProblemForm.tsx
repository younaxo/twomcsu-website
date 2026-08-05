'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { CaptchaField, type CaptchaFieldHandle } from '@/components/shared/CaptchaField';
import { FileUploadZone } from '@/components/reports/FileUploadZone';
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
import { useAuth } from '@/hooks/useAuth';
import { useServers } from '@/hooks/servers';
import { useCreateDonationProblem } from '@/hooks/reports/useReports';
import { api, extractErrorMessage } from '@/lib/api';

type FormValues = { captchaToken: string };

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  const normalized = digits.startsWith('8') ? `7${digits.slice(1)}` : digits;
  const d = normalized.startsWith('7') ? normalized : `7${normalized}`;
  const parts = [
    d.slice(0, 1),
    d.slice(1, 4),
    d.slice(4, 7),
    d.slice(7, 9),
    d.slice(9, 11),
  ];
  let result = '+7';
  if (parts[1]) result += ` (${parts[1]}`;
  if (parts[1]?.length === 3) result += ')';
  if (parts[2]) result += ` ${parts[2]}`;
  if (parts[3]) result += `-${parts[3]}`;
  if (parts[4]) result += `-${parts[4]}`;
  return result;
}

export function DonationProblemForm() {
  const router = useRouter();
  const { user } = useAuth();
  const servers = useServers();
  const create = useCreateDonationProblem();
  const captchaRef = useRef<CaptchaFieldHandle>(null);
  const form = useForm<FormValues>({ defaultValues: { captchaToken: '' } });

  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('+7');
  const [server, setServer] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentTime, setPaymentTime] = useState('');
  const [description, setDescription] = useState('');
  const [additionalText, setAdditionalText] = useState('');
  const [paymentPdf, setPaymentPdf] = useState<File[]>([]);
  const [cardPdf, setCardPdf] = useState<File[]>([]);
  const [bankPdf, setBankPdf] = useState<File[]>([]);
  const [extraFiles, setExtraFiles] = useState<File[]>([]);

  const pdfAccept = { 'application/pdf': ['.pdf'] };

  const submit = form.handleSubmit(async ({ captchaToken }) => {
    if (!email.trim() || !server || !paymentDate || description.trim().length < 20) {
      toast.error('Заполните обязательные поля');
      return;
    }
    if (phone.replace(/\D/g, '').length < 11) {
      toast.error('Укажите корректный номер телефона');
      return;
    }
    if (paymentPdf.length < 1 || cardPdf.length < 1 || bankPdf.length < 1) {
      toast.error('Прикрепите все обязательные PDF-выписки');
      return;
    }
    if (!captchaToken) {
      toast.error('Пройдите капчу');
      return;
    }

    const paymentIso = new Date(`${paymentDate}T${paymentTime || '00:00'}:00`).toISOString();

    try {
      const report = await create.mutateAsync({
        contactEmail: email.trim(),
        contactPhone: phone.trim(),
        server,
        paymentDate: paymentIso,
        description: description.trim(),
        additionalText: additionalText.trim() || undefined,
        captchaToken,
      });

      const allFiles = [...paymentPdf, ...cardPdf, ...bankPdf, ...extraFiles];
      for (const file of allFiles) {
        const formData = new FormData();
        formData.append('file', file);
        await api.post(`/reports/${report.reportNumber}/attachments`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      toast.success(`Обращение ${report.reportNumber} отправлено`);
      router.push(`/report/${report.reportNumber}`);
    } catch (error) {
      captchaRef.current?.reset();
      toast.error(extractErrorMessage(error, 'Не удалось отправить обращение'));
    }
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Проблема с донатом</h1>
      </div>

      <div className="rounded-xl glass-medium p-4 text-sm text-neutral-200">
        Обращения по донату рассматриваются руководством проекта. Заполните все поля максимально
        подробно.
      </div>

      <FormProvider {...form}>
        <form onSubmit={submit} className="space-y-5 rounded-2xl glass-strong p-5">
          <div className="space-y-2">
            <Label>Почта для связи *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Ваш ник</Label>
            <Input value={user?.username ?? ''} readOnly className="opacity-80" />
          </div>

          <div className="space-y-2">
            <Label>Сервер *</Label>
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

          <div className="space-y-2">
            <Label>Ваш номер телефона *</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="+7 (___) ___-__-__"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Дата платежа *</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Время платежа *</Label>
              <Input
                type="time"
                value={paymentTime}
                onChange={(e) => setPaymentTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Выписка по платежу (.pdf) *</Label>
            <FileUploadZone
              files={paymentPdf}
              onChange={setPaymentPdf}
              maxFiles={5}
              accept={pdfAccept}
              hint="Только PDF, до 5 файлов, макс. 10 МБ"
            />
          </div>

          <div className="space-y-2">
            <Label>Выписка по карте (.pdf) *</Label>
            <FileUploadZone
              files={cardPdf}
              onChange={setCardPdf}
              maxFiles={5}
              accept={pdfAccept}
              hint="Только PDF, до 5 файлов"
            />
          </div>

          <div className="space-y-2">
            <Label>Квитанция из банка (.pdf) *</Label>
            <FileUploadZone
              files={bankPdf}
              onChange={setBankPdf}
              maxFiles={5}
              accept={pdfAccept}
              hint="Только PDF, до 5 файлов"
            />
          </div>

          <div className="space-y-2">
            <Label>Описание проблемы *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label>Дополнительные файлы</Label>
            <FileUploadZone files={extraFiles} onChange={setExtraFiles} maxFiles={10} />
          </div>

          <div className="space-y-2">
            <Label>Дополнительный текст</Label>
            <Textarea
              value={additionalText}
              onChange={(e) => setAdditionalText(e.target.value)}
              rows={3}
            />
          </div>

          <CaptchaField ref={captchaRef} />

          <div className="flex justify-end gap-2">
            <Button asChild variant="ghost">
              <Link href="/report">Отмена</Link>
            </Button>
            <Button
              type="submit"
              disabled={create.isPending}
              className="bg-[#F57C00] text-black hover:bg-[#F57C00]/90"
            >
              Отправить
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
