import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AchievementsModule } from '../achievements/achievements.module';
import { PositionsModule } from '../positions/positions.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BruteForceService } from './brute-force.service';
import { CaptchaService } from './captcha.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    PositionsModule,
    forwardRef(() => AchievementsModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, BruteForceService, CaptchaService, JwtStrategy],
  exports: [AuthService, JwtModule, CaptchaService],
})
export class AuthModule {}
