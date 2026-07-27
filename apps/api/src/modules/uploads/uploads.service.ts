import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { mkdir, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  AVATAR_SIZE,
  BANNER_HEIGHT,
  BANNER_WIDTH,
  UPLOADS_ROUTE,
} from './upload.constants';

type UploadKind = 'avatars' | 'banners';

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

  private store(kind: UploadKind, userId: string, transform: (image: sharp.Sharp) => sharp.Sharp) {
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
