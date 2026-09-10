import { redirect } from '@/i18n/navigation';
import { getLocale } from 'next-intl/server';

export default async function RedirectPage() {
  const locale = await getLocale();
  redirect({ href: '/moderation/comment-reports', locale });
}
