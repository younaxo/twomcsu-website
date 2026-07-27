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

const registerSchema = z
  .object({
    email: z.string().email('Некорректный email'),
    username: z
      .string()
      .min(3, 'Никнейм от 3 символов')
      .max(16, 'Никнейм до 16 символов')
      .regex(/^[a-zA-Z0-9_]+$/, 'Только латиница, цифры и _'),
    password: z
      .string()
      .min(8, 'Пароль от 8 символов')
      .regex(/[A-Z]/, 'Нужна хотя бы одна заглавная буква')
      .regex(/\d/, 'Нужна хотя бы одна цифра'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Пароли не совпадают',
  });

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const captcha = useRef<CaptchaHandle>(null);
  const [captchaToken, setCaptchaToken] = useState<string>();

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', username: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: RegisterValues) => {
    try {
      await register(values.email, values.username, values.password, captchaToken);

      toast.success('Регистрация успешна, теперь войдите');
      router.push('/login');
    } catch (error) {
      captcha.current?.reset();
      setCaptchaToken(undefined);
      toast.error(extractErrorMessage(error, 'Не удалось зарегистрироваться'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Регистрация</CardTitle>
        <CardDescription>Один аккаунт для сайта и внутриигровых покупок</CardDescription>
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

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Никнейм</FormLabel>
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
                    <Input type="password" autoComplete="new-password" {...field} />
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
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Captcha
              ref={captcha}
              onVerify={setCaptchaToken}
              onExpire={() => setCaptchaToken(undefined)}
            />

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
            </Button>
          </form>
        </Form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Войти
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
