import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { BruteForceService } from './brute-force.service';
import { CaptchaService } from './captcha.service';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({})],
  providers: [AuthService, BruteForceService, CaptchaService],
  exports: [AuthService],
})
export class AuthModule {}
