import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

/** Keep the file in memory so sharp can resize before it hits disk */
export function imageUploadOptions(maxSize: number): MulterOptions {
  return {
    storage: memoryStorage(),
    limits: { fileSize: maxSize, files: 1 },
  };
}
