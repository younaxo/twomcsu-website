import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PerformanceMiddleware } from './common/middleware/performance.middleware';
import { configuration } from './config/configuration';
import { validateEnv } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { AwardsModule } from './modules/awards/awards.module';
import { CustomPositionsModule } from './modules/custom-positions/custom-positions.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { CacheModule } from './modules/cache/cache.module';
import { ChatModule } from './modules/chat/chat.module';
import { CommentsModule } from './modules/comments/comments.module';
import { FriendsModule } from './modules/friends/friends.module';
import { HealthModule } from './modules/health/health.module';
import { MinecraftModule } from './modules/minecraft/minecraft.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { PositionsModule } from './modules/positions/positions.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { RedisModule } from './modules/redis/redis.module';
import { ReportsModule } from './modules/reports/reports.module';
import { StoreModule } from './modules/store/store.module';
import { SystemModule } from './modules/system/system.module';
import { TopicsModule } from './modules/topics/topics.module';
import { NewsModule } from './modules/news/news.module';
import { MaintenanceMiddleware } from './modules/system/maintenance.middleware';
import { UploadsModule } from './modules/uploads/uploads.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // .env лежит в корне монорепо, локальный файл в apps/api его перекрывает
      envFilePath: ['.env', '../../.env'],
      load: [configuration],
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
    PrismaModule,
    RedisModule,
    CacheModule,
    UploadsModule,
    HealthModule,
    AuthModule,
    PositionsModule,
    UsersModule,
    AwardsModule,
    CustomPositionsModule,
    DepartmentsModule,
    FriendsModule,
    CommentsModule,
    NotificationsModule,
    StoreModule,
    MinecraftModule,
    AdminModule,
    ChatModule,
    SystemModule,
    TopicsModule,
    NewsModule,
    ReportsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(PerformanceMiddleware, MaintenanceMiddleware).forRoutes('*');
  }
}
