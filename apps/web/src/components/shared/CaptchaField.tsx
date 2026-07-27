'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { Captcha, CaptchaHandle } from '@/components/shared/Captcha';

interface CaptchaFormValues {
  captchaToken: string;
}

export interface CaptchaFieldHandle {
  reset: () => void;
}

/**
 * Keeps the hCaptcha token inside the form state, so zod guards the submit button
 * instead of every page juggling its own useState.
 */
export const CaptchaField = forwardRef<CaptchaFieldHandle>(function CaptchaField(_props, ref) {
  const widget = useRef<CaptchaHandle>(null);
  const { setValue, formState } = useFormContext<CaptchaFormValues>();

  const clear = () => setValue('captchaToken', '');

  useImperativeHandle(ref, () => ({
    reset: () => {
      widget.current?.reset();
      clear();
    },
  }));

  return (
    <div className="space-y-2">
      <Captcha
        ref={widget}
        onVerify={(token) => setValue('captchaToken', token, { shouldValidate: true })}
        onExpire={clear}
      />

      {formState.errors.captchaToken ? (
        <p className="text-sm text-destructive">{formState.errors.captchaToken.message}</p>
      ) : null}
    </div>
  );
});
