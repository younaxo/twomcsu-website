'use client';

import HCaptcha from '@hcaptcha/react-hcaptcha';
import { forwardRef, useImperativeHandle, useRef } from 'react';

export interface CaptchaHandle {
  reset: () => void;
}

interface CaptchaProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

export const Captcha = forwardRef<CaptchaHandle, CaptchaProps>(function Captcha(
  { onVerify, onExpire },
  ref,
) {
  const widget = useRef<HCaptcha>(null);
  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

  useImperativeHandle(ref, () => ({
    reset: () => widget.current?.resetCaptcha(),
  }));

  if (!siteKey) {
    return (
      <p className="text-sm text-destructive">
        Капча не настроена: нет NEXT_PUBLIC_HCAPTCHA_SITE_KEY
      </p>
    );
  }

  return (
    <HCaptcha
      ref={widget}
      sitekey={siteKey}
      theme="dark"
      languageOverride="ru"
      onVerify={onVerify}
      onExpire={onExpire}
    />
  );
});
