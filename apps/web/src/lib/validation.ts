import type { z } from 'zod';

export const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

const WEAK_PASSWORD_MESSAGE = 'Пароль минимум 8 символов, заглавная буква и цифра';

/**
 * A weak password paints both fields red, a typo in the repeat only the second one.
 * Lives in a superRefine because per-field rules would leave the confirmation untouched.
 */
export function checkPasswordPair(
  ctx: z.RefinementCtx,
  password: string,
  confirmPassword: string,
  passwordPath = 'password',
): void {
  if (!PASSWORD_PATTERN.test(password)) {
    ctx.addIssue({ code: 'custom', message: WEAK_PASSWORD_MESSAGE, path: [passwordPath] });
    ctx.addIssue({ code: 'custom', message: WEAK_PASSWORD_MESSAGE, path: ['confirmPassword'] });

    return;
  }

  if (password !== confirmPassword) {
    ctx.addIssue({ code: 'custom', message: 'Пароли не совпадают', path: ['confirmPassword'] });
  }
}
