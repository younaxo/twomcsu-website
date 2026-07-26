'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Captcha, CaptchaHandle } from '@/components/shared/Captcha';
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
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const captcha = useRef<CaptchaHandle>(null);
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { emailOrUsername: '', password: '' },
  });

  const onSubmit = async (values: LoginValues) => {
    if (requiresCaptcha && !captchaToken) {
      toast.error('Подтвердите, что вы не робот');

      return;
    }

    try {
      const result = await login(values.emailOrUsername, values.password, captchaToken);

      if (result.requiresCaptcha) {
        setRequiresCaptcha(true);
        toast.warning('Слишком много попыток входа, подтвердите капчу');

        return;
      }

      router.push('/');
      router.refresh();
    } catch (error) {
      captcha.current?.reset();
      setCaptchaToken(undefined);
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
                  <FormLabel>Пароль</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {requiresCaptcha && (
              <Captcha
                ref={captcha}
                onVerify={setCaptchaToken}
                onExpire={() => setCaptchaToken(undefined)}
              />
            )}

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
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
