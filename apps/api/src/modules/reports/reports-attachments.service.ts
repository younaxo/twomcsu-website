import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { UPLOADS_ROUTE } from '../uploads/upload.constants';
import { UploadsService } from '../uploads/uploads.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReportAttachment, ReportMessageAttachment } from '@twomc/shared';
import { toReportAttachment, toReportMessageAttachment } from './report.mapper';

const MAX_ATTACHMENTS = 10;
const MAX_MESSAGE_ATTACHMENTS = 5;
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_OTHER_BYTES = 20 * 1024 * 1024;

const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const PDF_MIME = 'application/pdf';
const ALLOWED_MIME = new Set([
  ...IMAGE_MIME,
  PDF_MIME,
  'video/mp4',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

@Injectable()
export class ReportsAttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  assertAllowedFile(file: Express.Multer.File, pdfOnly = false): void {
    const mime = file.mimetype;
    if (pdfOnly && mime !== PDF_MIME) {
      throw new BadRequestException('Допускаются только PDF-файлы');
    }

    if (!ALLOWED_MIME.has(mime)) {
      throw new BadRequestException('Недопустимый тип файла');
    }

    const max = IMAGE_MIME.has(mime)
      ? MAX_IMAGE_BYTES
      : mime === PDF_MIME
        ? MAX_PDF_BYTES
        : MAX_OTHER_BYTES;

    if (file.size > max) {
      throw new BadRequestException(
        `Файл слишком большой (макс. ${Math.round(max / (1024 * 1024))} МБ)`,
      );
    }
  }

  async saveAttachment(
    reportId: string,
    file: Express.Multer.File,
    uploadedBy: string,
    options?: { pdfOnly?: boolean },
  ): Promise<ReportAttachment> {
    this.assertAllowedFile(file, options?.pdfOnly);

    const count = await this.prisma.reportAttachment.count({ where: { reportId } });
    if (count >= MAX_ATTACHMENTS) {
      throw new BadRequestException(`Можно прикрепить не более ${MAX_ATTACHMENTS} файлов`);
    }

    const directory = join(this.uploads.rootDir, 'reports', reportId);
    await mkdir(directory, { recursive: true });

    const ext = extname(file.originalname) || '';
    const storedName = `${randomBytes(8).toString('hex')}${ext}`;
    await writeFile(join(directory, storedName), file.buffer);

    const row = await this.prisma.reportAttachment.create({
      data: {
        reportId,
        fileName: file.originalname,
        fileUrl: `${UPLOADS_ROUTE}/reports/${reportId}/${storedName}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy,
      },
    });

    return toReportAttachment(row);
  }

  async saveMessageAttachment(
    reportId: string,
    messageId: string,
    file: Express.Multer.File,
    uploadedBy: string,
  ): Promise<ReportMessageAttachment> {
    this.assertAllowedFile(file);

    const count = await this.prisma.reportMessageAttachment.count({
      where: { messageId },
    });
    if (count >= MAX_MESSAGE_ATTACHMENTS) {
      throw new BadRequestException(
        `К сообщению можно прикрепить не более ${MAX_MESSAGE_ATTACHMENTS} файлов`,
      );
    }

    const directory = join(this.uploads.rootDir, 'reports', reportId, 'messages', messageId);
    await mkdir(directory, { recursive: true });

    const ext = extname(file.originalname) || '';
    const storedName = `${randomBytes(8).toString('hex')}${ext}`;
    await writeFile(join(directory, storedName), file.buffer);

    const row = await this.prisma.reportMessageAttachment.create({
      data: {
        messageId,
        fileName: file.originalname,
        fileUrl: `${UPLOADS_ROUTE}/reports/${reportId}/messages/${messageId}/${storedName}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy,
      },
    });

    return toReportMessageAttachment(row);
  }
}
