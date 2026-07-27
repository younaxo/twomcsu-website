'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { SuccessResponse } from '@twomc/shared';
import { MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { api, extractErrorMessage } from '@/lib/api';

const forgotSchema = z.object({
  email: z.string().email('Некорректный email'),
  captchaToken: z.string().min(1, 'Подтвердите, что вы не робот'),
});

type ForgotValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const captcha = useRef<CaptchaFieldHandle>(null);
  const [isSent, setSent] = useState(false);

  const form = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '', captchaToken: '' },
  });

  const captchaToken = form.watch('captchaToken');

  const onSubmit = async (values: ForgotValues) => {
    try {
      await api.post<SuccessResponse>('/auth/forgot-password', values);
      setSent(true);
    } catch (error) {
      captcha.current?.reset();
      toast.error(extractErrorMessage(error, 'Не удалось отправить письмо'));
    }
  };

  if (isSent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <MailCheck className="h-6 w-6 text-primary" />
            Проверьте почту
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Если такой email существует, мы отправили на него ссылку для сброса пароля. Ссылка живёт
            один час.
          </p>

          <Button variant="secondary" className="w-full" asChild>
            <Link href="/login">Вернуться к входу</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Восстановление пароля</CardTitle>
        <CardDescription>Пришлём ссылку для сброса на почту от аккаунта</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="steve@mail.ru"
                      {...field}
                    />
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
              {form.formState.isSubmitting ? 'Отправляем...' : 'Отправить ссылку'}
            </Button>
          </form>
        </Form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Вспомнили пароль?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Войти
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
