import { Injectable, BadRequestException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { createObjectCsvStringifier } from 'csv-writer';
import ExcelJS from 'exceljs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { PrismaService } from '../prisma/prisma.service';

export type ExportFormat = 'csv' | 'excel' | 'pdf';

export type ExportResult = {
  buffer: Buffer;
  contentType: string;
  filename: string;
};

type Row = Record<string, string | number | boolean | null | undefined>;

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  async export(rows: Row[], filename: string, format: ExportFormat): Promise<ExportResult> {
    switch (format) {
      case 'csv':
        return this.exportToCsv(rows, filename);
      case 'excel':
        return this.exportToExcel(rows, filename);
      case 'pdf':
        return this.exportToPdf(rows, filename);
      default:
        throw new BadRequestException('Неподдерживаемый формат экспорта');
    }
  }

  async exportToCsv(data: Row[], filename: string): Promise<ExportResult> {
    const headers = Object.keys(data[0] ?? { empty: '' });
    const stringifier = createObjectCsvStringifier({
      header: headers.map((id) => ({ id, title: id })),
    });
    const body =
      stringifier.getHeaderString() +
      stringifier.stringifyRecords(
        data.length
          ? data.map((row) =>
              Object.fromEntries(headers.map((h) => [h, stringifyCell(row[h])])),
            )
          : [],
      );
    const withBom = '\uFEFF' + body;
    return {
      buffer: Buffer.from(withBom, 'utf8'),
      contentType: 'text/csv; charset=utf-8',
      filename: `${filename}.csv`,
    };
  }

  async exportToExcel(
    data: Row[],
    filename: string,
    options?: { sheetName?: string },
  ): Promise<ExportResult> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TWOMC';
    workbook.created = new Date();
    const sheet = workbook.addWorksheet(options?.sheetName ?? 'Данные');
    const headers = Object.keys(data[0] ?? { empty: '' });

    sheet.columns = headers.map((header) => ({
      header,
      key: header,
      width: Math.min(40, Math.max(12, header.length + 4)),
    }));

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF57C00' },
    };

    for (const row of data) {
      sheet.addRow(Object.fromEntries(headers.map((h) => [h, stringifyCell(row[h])])));
    }

    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: headers.length || 1 },
    };

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    return {
      buffer,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: `${filename}.xlsx`,
    };
  }

  async exportToPdf(data: Row[], filename: string): Promise<ExportResult> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const headers = Object.keys(data[0] ?? { empty: '' });
    const margin = 40;
    const pageWidth = 842;
    const pageHeight = 595;
    let page = doc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const drawHeader = () => {
      page.drawText('TWOMC — Export', {
        x: margin,
        y,
        size: 16,
        font: bold,
        color: rgb(0.96, 0.49, 0),
      });
      y -= 18;
      page.drawText(new Date().toLocaleString('ru-RU'), {
        x: margin,
        y,
        size: 9,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      y -= 20;
    };

    drawHeader();

    const colWidth = Math.max(60, (pageWidth - margin * 2) / Math.max(headers.length, 1));

    const drawTableHeader = () => {
      headers.forEach((header, index) => {
        page.drawText(truncate(header, 18), {
          x: margin + index * colWidth,
          y,
          size: 9,
          font: bold,
          color: rgb(0.1, 0.1, 0.1),
        });
      });
      y -= 14;
    };

    drawTableHeader();

    for (const row of data) {
      if (y < margin + 30) {
        page = doc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
        drawHeader();
        drawTableHeader();
      }
      headers.forEach((header, index) => {
        page.drawText(truncate(stringifyCell(row[header]), 18), {
          x: margin + index * colWidth,
          y,
          size: 8,
          font,
          color: rgb(0.15, 0.15, 0.15),
        });
      });
      y -= 12;
    }

    const pages = doc.getPages();
    pages.forEach((p, index) => {
      p.drawText(`Страница ${index + 1} / ${pages.length}`, {
        x: pageWidth - margin - 90,
        y: 20,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
    });

    const buffer = Buffer.from(await doc.save());
    return {
      buffer,
      contentType: 'application/pdf',
      filename: `${filename}.pdf`,
    };
  }

  async exportUsers(
    filters: {
      search?: string;
      roleGroup?: string;
      isBanned?: boolean;
      dateFrom?: Date;
      dateTo?: Date;
      userIds?: string[];
    },
    format: ExportFormat,
  ): Promise<ExportResult> {
    const where: Prisma.UserWhereInput = {
      ...(filters.userIds?.length ? { id: { in: filters.userIds } } : {}),
      ...(filters.roleGroup
        ? { roleGroup: filters.roleGroup as Prisma.UserWhereInput['roleGroup'] }
        : {}),
      ...(filters.isBanned !== undefined ? { isBanned: filters.isBanned } : {}),
      ...(filters.dateFrom || filters.dateTo
        ? {
            createdAt: {
              ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
              ...(filters.dateTo ? { lte: filters.dateTo } : {}),
            },
          }
        : {}),
      ...(filters.search
        ? {
            OR: [
              { username: { contains: filters.search, mode: 'insensitive' } },
              { email: { contains: filters.search, mode: 'insensitive' } },
              { tag: { contains: filters.search, mode: 'insensitive' } },
              ...(Number.isFinite(Number(filters.search))
                ? [{ shortId: Number(filters.search) }]
                : []),
            ],
          }
        : {}),
    };

    const users = await this.prisma.user.findMany({
      where,
      include: { position: true },
      orderBy: { createdAt: 'desc' },
      take: 10_000,
    });

    const rows = users.map((user) => ({
      ID: user.shortId,
      Username: user.username,
      Email: user.email,
      Роль: user.roleGroup,
      Позиция: user.position?.displayName ?? '',
      Регистрация: user.createdAt.toISOString(),
      'Последний вход': user.lastLoginAt?.toISOString() ?? '',
      Забанен: user.isBanned ? 'Да' : 'Нет',
    }));

    return this.export(rows, `users-${Date.now()}`, format);
  }

  async exportOrders(
    filters: {
      status?: OrderStatus;
      dateFrom?: Date;
      dateTo?: Date;
      userId?: string;
    },
    format: ExportFormat,
  ): Promise<ExportResult> {
    const where: Prisma.OrderWhereInput = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.dateFrom || filters.dateTo
        ? {
            createdAt: {
              ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
              ...(filters.dateTo ? { lte: filters.dateTo } : {}),
            },
          }
        : {}),
    };

    const orders = await this.prisma.order.findMany({
      where,
      include: { user: { select: { username: true, shortId: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10_000,
    });

    const rows = orders.map((order) => ({
      ID: order.id,
      Пользователь: order.user?.username ?? order.guestMinecraftNick ?? '',
      Email: order.user?.email ?? '',
      Статус: order.status,
      Сумма: Number(order.total),
      Дата: order.createdAt.toISOString(),
    }));

    return this.export(rows, `orders-${Date.now()}`, format);
  }

  async exportReports(
    filters: {
      status?: string;
      type?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
    format: ExportFormat,
  ): Promise<ExportResult> {
    const where: Prisma.ReportWhereInput = {
      isArchived: false,
      ...(filters.status ? { status: filters.status as Prisma.EnumReportStatusFilter['equals'] } : {}),
      ...(filters.type ? { type: filters.type as Prisma.EnumReportTypeFilter['equals'] } : {}),
      ...(filters.dateFrom || filters.dateTo
        ? {
            createdAt: {
              ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
              ...(filters.dateTo ? { lte: filters.dateTo } : {}),
            },
          }
        : {}),
    };

    const reports = await this.prisma.report.findMany({
      where,
      include: {
        author: { select: { username: true } },
        assignedTo: { select: { username: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10_000,
    });

    const rows = reports.map((report) => ({
      Номер: report.reportNumber,
      Тип: report.type,
      Статус: report.status,
      Автор: report.author.username,
      Исполнитель: report.assignedTo?.username ?? '',
      Создано: report.createdAt.toISOString(),
      Закрыто: report.resolvedAt?.toISOString() ?? '',
    }));

    return this.export(rows, `reports-${Date.now()}`, format);
  }

  async exportNews(
    filters: { status?: string; dateFrom?: Date; dateTo?: Date },
    format: ExportFormat,
  ): Promise<ExportResult> {
    const where: Prisma.NewsWhereInput = {
      ...(filters.status ? { status: filters.status as Prisma.EnumNewsStatusFilter['equals'] } : {}),
      ...(filters.dateFrom || filters.dateTo
        ? {
            createdAt: {
              ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
              ...(filters.dateTo ? { lte: filters.dateTo } : {}),
            },
          }
        : {}),
    };

    const news = await this.prisma.news.findMany({
      where,
      include: { author: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10_000,
    });

    const rows = news.map((item) => ({
      ID: item.id,
      Заголовок: item.title,
      Статус: item.status,
      Категория: item.category,
      Автор: item.author.username,
      Просмотры: item.viewsCount,
      Лайки: item.likesCount,
      Опубликовано: item.publishedAt?.toISOString() ?? '',
    }));

    return this.export(rows, `news-${Date.now()}`, format);
  }

  async exportAuditLog(
    filters: {
      actorId?: string;
      action?: string;
      severity?: string;
      dateFrom?: Date;
      dateTo?: Date;
      search?: string;
    },
    format: ExportFormat,
  ): Promise<ExportResult> {
    const where: Prisma.AuditLogWhereInput = {
      ...(filters.actorId ? { actorId: filters.actorId } : {}),
      ...(filters.action ? { action: { contains: filters.action, mode: 'insensitive' } } : {}),
      ...(filters.severity ? { severity: filters.severity } : {}),
      ...(filters.search
        ? {
            OR: [
              { action: { contains: filters.search, mode: 'insensitive' } },
              { targetType: { contains: filters.search, mode: 'insensitive' } },
              { targetId: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(filters.dateFrom || filters.dateTo
        ? {
            createdAt: {
              ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
              ...(filters.dateTo ? { lte: filters.dateTo } : {}),
            },
          }
        : {}),
    };

    const rowsDb = await this.prisma.auditLog.findMany({
      where,
      include: { actor: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10_000,
    });

    const rows = rowsDb.map((row) => ({
      Дата: row.createdAt.toISOString(),
      Actor: row.actor.username,
      Action: row.action,
      Severity: row.severity,
      Target: row.targetType ?? '',
      TargetId: row.targetId ?? '',
      IP: row.ipAddress ?? '',
    }));

    return this.export(rows, `audit-log-${Date.now()}`, format);
  }
}

function stringifyCell(value: Row[string]): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
  return String(value);
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}
