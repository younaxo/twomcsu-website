'use client';

import { REPORT_STATUS_LABELS, ReportStatus } from '@twomc/shared';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { FileText, Search } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { EmptyState } from '@/components/shared/EmptyState';
import { ReportStatusBadge } from '@/components/reports/ReportStatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useRoleGuard } from '@/components/admin/useRoleGuard';
import { RoleGroup } from '@twomc/shared';
import { useDonationReports, useReport } from '@/hooks/reports/useReports';
import { resolveMediaUrl } from '@/lib/profile';

export default function AdminDonationSupportPage() {
  const { isLoading, allowed } = useRoleGuard(RoleGroup.OWNER);
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ReportStatus | ''>('');
  const [selected, setSelected] = useState<string | null>(null);

  const list = useDonationReports(
    {
      page,
      limit: 20,
      search: search.trim() || undefined,
      status: status || undefined,
    },
    allowed,
  );
  const detail = useReport(selected ?? '', Boolean(selected) && allowed);

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!allowed) return null;

  const items = list.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Проблемы с донатом</h1>
        <p className="text-sm text-muted-foreground">
          Только владелец проекта. Проверка платёжных документов.
        </p>
      </div>

      <div className="grid gap-3 rounded-2xl glass-medium p-4 md:grid-cols-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Поиск по номеру или автору"
            className="pl-9"
          />
        </div>
        <Select
          value={status || 'all'}
          onValueChange={(value) => {
            setStatus(value === 'all' ? '' : (value as ReportStatus));
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {(Object.keys(REPORT_STATUS_LABELS) as ReportStatus[]).map((item) => (
              <SelectItem key={item} value={item}>
                {REPORT_STATUS_LABELS[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-2xl glass-medium">
          {list.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : items.length === 0 ? (
            <EmptyState title="Нет обращений по донату" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead>#</TableHead>
                  <TableHead>Автор</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer border-white/5 hover:bg-white/[0.04]"
                    onClick={() => setSelected(item.reportNumber)}
                  >
                    <TableCell className="font-mono text-primary">{item.reportNumber}</TableCell>
                    <TableCell>{item.author.username}</TableCell>
                    <TableCell>
                      {format(new Date(item.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                    </TableCell>
                    <TableCell>
                      <ReportStatusBadge status={item.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="rounded-2xl glass-strong p-5">
          {!selected ? (
            <p className="text-sm text-muted-foreground">Выберите обращение для просмотра документов</p>
          ) : detail.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : detail.data ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-mono text-lg text-primary">{detail.data.reportNumber}</h2>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => router.push(`/report/${detail.data!.reportNumber}`)}
                >
                  Открыть полностью
                </Button>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Email: </span>
                  {detail.data.contactEmail ?? '—'}
                </p>
                <p>
                  <span className="text-muted-foreground">Телефон: </span>
                  {detail.data.contactPhone ?? '—'}
                </p>
                <p>
                  <span className="text-muted-foreground">Сервер: </span>
                  {detail.data.server ?? '—'}
                </p>
                <p>
                  <span className="text-muted-foreground">Платёж: </span>
                  {detail.data.paymentDate
                    ? format(new Date(detail.data.paymentDate), 'dd.MM.yyyy HH:mm', { locale: ru })
                    : '—'}
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">Документы</h3>
                {detail.data.attachments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Файлы не прикреплены</p>
                ) : (
                  detail.data.attachments.map((file) => {
                    const url = resolveMediaUrl(file.fileUrl) ?? file.fileUrl;
                    const isPdf = file.mimeType === 'application/pdf';
                    return (
                      <a
                        key={file.id}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block overflow-hidden rounded-xl glass-light"
                      >
                        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-sm">
                          <FileText className="h-4 w-4 text-red-400" />
                          <span className="truncate">{file.fileName}</span>
                        </div>
                        {isPdf ? (
                          <iframe title={file.fileName} src={url} className="h-72 w-full bg-black/40" />
                        ) : file.mimeType.startsWith('image/') ? (
                          <Image
                            src={url}
                            alt={file.fileName}
                            width={640}
                            height={360}
                            className="h-auto w-full object-contain"
                            unoptimized
                          />
                        ) : null}
                      </a>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Не удалось загрузить обращение</p>
          )}
        </div>
      </div>
    </div>
  );
}
