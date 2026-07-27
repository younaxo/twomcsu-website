import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { mkdir } from 'node:fs/promises';
import { AppModule } from './app.module';
import { UPLOADS_ROUTE } from './modules/uploads/upload.constants';
import { UploadsService } from './modules/uploads/uploads.service';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: isProduction ? ['error', 'warn'] : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const config = app.get(ConfigService);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cookieParser());

  const uploadsDir = app.get(UploadsService).rootDir;
  await mkdir(uploadsDir, { recursive: true });
  app.useStaticAssets(uploadsDir, { prefix: UPLOADS_ROUTE, maxAge: '7d' });

  app.enableCors({
    origin: config.getOrThrow<string>('webOrigin'),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // корректно закрываем соединения по SIGTERM/SIGINT
  app.enableShutdownHooks();

  const port = config.getOrThrow<number>('port');
  await app.listen(port);

  Logger.log(`API is running on http://localhost:${port}`, 'Bootstrap');
}

void bootstrap();
