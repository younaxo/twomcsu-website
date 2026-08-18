import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import sharp, { type Sharp } from 'sharp';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  AVATAR_SIZE,
  BANNER_HEIGHT,
  BANNER_WIDTH,
  UPLOADS_ROUTE,
} from './upload.constants';

type UploadKind = 'avatars' | 'banners';

const MESSAGE_FILE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
  'text/plain': '.txt',
};

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(private readonly config: ConfigService) {}

  get rootDir(): string {
    return resolve(this.config.getOrThrow<string>('uploads.dir'));
  }

  get maxAvatarSize(): number {
    return this.config.getOrThrow<number>('uploads.maxAvatarSize');
  }

  get maxBannerSize(): number {
    return this.config.getOrThrow<number>('uploads.maxBannerSize');
  }

  async saveAvatar(userId: string, file: Express.Multer.File): Promise<string> {
    this.assertImage(file, this.maxAvatarSize);

    return this.store('avatars', userId, (image) =>
      image.resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover', position: 'centre' }),
    )(file);
  }

  async saveBanner(userId: string, file: Express.Multer.File): Promise<string> {
    this.assertImage(file, this.maxBannerSize);

    return this.store('banners', userId, (image) =>
      image.resize(BANNER_WIDTH, BANNER_HEIGHT, { fit: 'cover', position: 'centre' }),
    )(file);
  }

  async saveMessageAttachment(userId: string, file: Express.Multer.File) {
    const maxSize = 10 * 1024 * 1024;
    const extension = MESSAGE_FILE_EXTENSIONS[file?.mimetype];
    if (!file || !extension) {
      throw new BadRequestException('Поддерживаются изображения, PDF и TXT');
    }
    if (file.size > maxSize) {
      throw new BadRequestException('Файл больше 10 МБ');
    }

    if (file.mimetype.startsWith('image/')) {
      try {
        await sharp(file.buffer).metadata();
      } catch {
        throw new BadRequestException('Некорректное изображение');
      }
    }
    if (file.mimetype === 'application/pdf' && file.buffer.subarray(0, 5).toString() !== '%PDF-') {
      throw new BadRequestException('Некорректный PDF-файл');
    }

    const directory = join(this.rootDir, 'messages');
    await mkdir(directory, { recursive: true });
    const storedName = `${userId}-${randomBytes(12).toString('hex')}${extension}`;
    await writeFile(join(directory, storedName), file.buffer);
    const safeOriginalName = [...basename(file.originalname)]
      .filter((character) => character.charCodeAt(0) >= 32)
      .join('')
      .slice(0, 255);

    return {
      fileUrl: `${UPLOADS_ROUTE}/messages/${storedName}`,
      fileName: safeOriginalName || `file${extension}`,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  /** Silent on a missing file: the row is what matters, a leftover blob is not worth a 500 */
  async remove(publicPath: string | null): Promise<void> {
    if (!publicPath?.startsWith(`${UPLOADS_ROUTE}/`)) {
      return;
    }

    const relative = publicPath.slice(UPLOADS_ROUTE.length + 1);
    const absolute = resolve(this.rootDir, relative);

    // a crafted path must never escape the uploads folder
    if (!absolute.startsWith(this.rootDir)) {
      return;
    }

    try {
      await unlink(absolute);
    } catch (error) {
      this.logger.debug(`Cannot remove ${absolute}: ${String(error)}`);
    }
  }

  private store(kind: UploadKind, userId: string, transform: (image: Sharp) => Sharp) {
    return async (file: Express.Multer.File): Promise<string> => {
      const directory = join(this.rootDir, kind);
      await mkdir(directory, { recursive: true });

      const name = `${userId}-${randomBytes(8).toString('hex')}.webp`;

      try {
        await transform(sharp(file.buffer)).webp({ quality: 90 }).toFile(join(directory, name));
      } catch {
        throw new BadRequestException('Не удалось обработать изображение');
      }

      return `${UPLOADS_ROUTE}/${kind}/${name}`;
    };
  }

  private assertImage(file: Express.Multer.File | undefined, maxSize: number): void {
    if (!file) {
      throw new BadRequestException('Файл не выбран');
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
      throw new BadRequestException('Поддерживаются только JPEG, PNG, WEBP и GIF');
    }

    if (file.size > maxSize) {
      throw new BadRequestException(`Файл больше ${Math.round(maxSize / 1024 / 1024)} МБ`);
    }
  }
}
