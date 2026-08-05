'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { SuccessResponse } from '@twomc/shared';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { CaptchaField, CaptchaFieldHandle } from '@/components/shared/CaptchaField';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PasswordInput } from '@/components/ui/password-input';
import { Skeleton } from '@/components/ui/skeleton';
import { api, extractErrorMessage } from '@/lib/api';
import { checkPasswordPair } from '@/lib/validation';

const resetSchema = z
  .object({
    newPassword: z.string(),
    confirmPassword: z.string(),
    captchaToken: z.string().min(1, 'Подтвердите, что вы не робот'),
  })
  .superRefine((values, ctx) => {
    checkPasswordPair(ctx, values.newPassword, values.confirmPassword, 'newPassword');
  });

type ResetValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get('token');
  const captcha = useRef<CaptchaFieldHandle>(null);

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: '', confirmPassword: '', captchaToken: '' },
  });

  const captchaToken = form.watch('captchaToken');

  const onSubmit = async (values: ResetValues) => {
    try {
      await api.post<SuccessResponse>('/auth/reset-password', {
        token,
        newPassword: values.newPassword,
        captchaToken: values.captchaToken,
      });

      toast.success('Пароль обновлён, войдите с новым паролем');
      router.push('/login');
    } catch (error) {
      captcha.current?.reset();
      toast.error(extractErrorMessage(error, 'Не удалось сменить пароль'));
    }
  };

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Ссылка недействительна</CardTitle>
          <CardDescription>В адресе нет токена сброса</CardDescription>
        </CardHeader>

        <CardContent>
          <Button variant="secondary" className="w-full" asChild>
            <Link href="/forgot-password">Запросить новую ссылку</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Новый пароль</CardTitle>
        <CardDescription>После смены все сессии аккаунта закроются</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Новый пароль</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Повторите пароль</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CaptchaField ref={captcha} />

            <Button
              type="submit"
              className="w-full"
              disabled={!captchaToken || form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Сохраняем...' : 'Сменить пароль'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
