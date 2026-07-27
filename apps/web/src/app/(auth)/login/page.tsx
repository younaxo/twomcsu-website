'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
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
import { useAuth } from '@/hooks/useAuth';
import { extractErrorMessage } from '@/lib/api';

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Укажите email или никнейм'),
  password: z.string().min(1, 'Укажите пароль'),
  captchaToken: z.string().min(1, 'Подтвердите, что вы не робот'),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const captcha = useRef<CaptchaFieldHandle>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { emailOrUsername: '', password: '', captchaToken: '' },
  });

  const captchaToken = form.watch('captchaToken');

  const onSubmit = async (values: LoginValues) => {
    try {
      const result = await login(values.emailOrUsername, values.password, values.captchaToken);

      if (result.requiresCaptcha) {
        captcha.current?.reset();
        toast.warning('Капча устарела, подтвердите ещё раз');

        return;
      }

      router.push('/');
      router.refresh();
    } catch (error) {
      captcha.current?.reset();
      toast.error(extractErrorMessage(error, 'Не удалось войти'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Вход</CardTitle>
        <CardDescription>Войдите, чтобы попасть в профиль и магазин</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="emailOrUsername"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email или никнейм</FormLabel>
                  <FormControl>
                    <Input autoComplete="username" placeholder="steve" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Пароль</FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-muted-foreground hover:text-primary hover:underline"
                    >
                      Забыли пароль?
                    </Link>
                  </div>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" {...field} />
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
              {form.formState.isSubmitting ? 'Входим...' : 'Войти'}
            </Button>
          </form>
        </Form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Нет аккаунта?{' '}
          <Link href="/register" className="text-primary hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
