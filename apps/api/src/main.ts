import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create(AppModule, {
    logger: isProduction ? ['error', 'warn', 'log'] : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const config = app.get(ConfigService);

  app.use(helmet());
  app.enableCors({
    origin: config.getOrThrow<string>('webOrigin'),
    credentials: true,
  });

  // корректно закрываем соединения по SIGTERM/SIGINT
  app.enableShutdownHooks();

  const port = config.getOrThrow<number>('port');
  await app.listen(port);

  Logger.log(`API is running on http://localhost:${port}`, 'Bootstrap');
}

void bootstrap();
