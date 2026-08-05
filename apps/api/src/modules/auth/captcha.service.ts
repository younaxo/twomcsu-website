import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const VERIFY_URL = 'https://api.hcaptcha.com/siteverify';

interface SiteVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
}

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);

  constructor(private readonly config: ConfigService) {}

  get isDisabled(): boolean {
    return this.config.get<boolean>('captcha.disabled') === true;
  }

  async verify(token: string | undefined, ip?: string): Promise<void> {
    if (this.isDisabled) {
      return;
    }

    if (!token) {
      throw new BadRequestException('Подтвердите, что вы не робот');
    }

    const body = new URLSearchParams({
      secret: this.config.getOrThrow<string>('captcha.secret'),
      response: token,
    });

    if (ip) {
      body.set('remoteip', ip);
    }

    let result: SiteVerifyResponse;

    try {
      const response = await fetch(VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(5000),
      });

      result = (await response.json()) as SiteVerifyResponse;
    } catch (error) {
      this.logger.error(`hCaptcha is unreachable: ${(error as Error).message}`);
      throw new BadRequestException('Не удалось проверить капчу, попробуйте ещё раз');
    }

    if (!result.success) {
      const codes = result['error-codes']?.join(', ') ?? 'no error code';
      this.logger.warn(`hCaptcha rejected ${ip ?? 'unknown ip'}: ${codes}`);
      throw new BadRequestException('Проверка капчи не пройдена');
    }
  }
}
