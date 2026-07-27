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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
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
    promoCode: z
      .string()
      .max(32, 'Промокод до 32 символов')
      .regex(/^[A-Z0-9_-]*$/, 'Только заглавная латиница, цифры, дефис и _'),
    captchaToken: z.string().min(1, 'Подтвердите, что вы не робот'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Пароли не совпадают',
  });

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const captcha = useRef<CaptchaFieldHandle>(null);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      promoCode: '',
      captchaToken: '',
    },
  });

  const captchaToken = form.watch('captchaToken');

  const onSubmit = async (values: RegisterValues) => {
    try {
      const promo = await register({
        email: values.email,
        username: values.username,
        password: values.password,
        captchaToken: values.captchaToken,
        promoCode: values.promoCode || undefined,
      });

      toast.success('Регистрация успешна, теперь войдите');

      if (promo) {
        const notify = promo.applied ? toast.success : toast.warning;
        notify(promo.message);
      }

      router.push('/login');
    } catch (error) {
      captcha.current?.reset();
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

            <FormField
              control={form.control}
              name="promoCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Промокод (необязательно)</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="off"
                      placeholder="WELCOME2024"
                      {...field}
                      onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormDescription>Скидка применится при первой покупке в магазине</FormDescription>
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
