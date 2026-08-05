'use client';

import { FormVisibility } from '@twomc/shared';
import { ClipboardList, Lock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useForms } from '@/hooks/forms';

const VISIBILITY_LABELS: Record<FormVisibility, string> = {
  [FormVisibility.PUBLIC]: 'Публично',
  [FormVisibility.AUTHENTICATED]: 'Только для авторизованных',
  [FormVisibility.HELPER_ONLY]: 'Только Helper+',
  [FormVisibility.MODERATOR_ONLY]: 'Только Moderator+',
  [FormVisibility.ADMIN_ONLY]: 'Только Admin+',
  [FormVisibility.OWNER_ONLY]: 'Только владелец',
  [FormVisibility.INVITE_ONLY]: 'По приглашению',
};

export default function FormsListPage() {
  const forms = useForms();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl glass-strong p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-white">Формы</h1>
            <p className="mt-1 text-muted-foreground">
              Заявки, опросы и голосования сообщества
            </p>
          </div>
        </div>
      </section>

      {forms.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : forms.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.data.map((form) => (
            <Link
              key={form.id}
              href={`/forms/${form.slug}`}
              className="group block overflow-hidden rounded-2xl glass-medium transition-colors hover:bg-white/10"
            >
              {form.coverImage ? (
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={form.coverImage}
                    alt={form.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : null}
              <div className="space-y-3 p-4">
                <h2 className="line-clamp-2 text-lg font-semibold text-white">{form.title}</h2>
                {form.description ? (
                  <p className="line-clamp-3 text-sm text-muted-foreground">{form.description}</p>
                ) : null}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    {VISIBILITY_LABELS[form.visibility]}
                  </span>
                  <span>{form.responsesCount} ответов</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl glass-medium p-10 text-center text-muted-foreground">
          Пока нет доступных форм
        </div>
      )}
    </div>
  );
}
