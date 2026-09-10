import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import type { Request } from 'express';
import { CookieConsentRecord } from '@twomc/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConsentService } from './consent.service';

class UpdateConsentDto {
  @IsBoolean()
  analytics!: boolean;

  @IsBoolean()
  marketing!: boolean;

  @IsBoolean()
  preferences!: boolean;
}

/** Server-side cookie consent for signed-in users — synced from/to the client-side cookie on login */
@Controller('users/me/consent')
@UseGuards(JwtAuthGuard)
export class ConsentController {
  constructor(private readonly consent: ConsentService) {}

  @Get()
  get(@CurrentUser('id') userId: string): Promise<CookieConsentRecord | null> {
    return this.consent.get(userId);
  }

  @Put()
  save(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateConsentDto,
    @Req() req: Request,
  ): Promise<CookieConsentRecord> {
    return this.consent.save(userId, dto, req.ip);
  }
}
