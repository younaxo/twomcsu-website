import { redirect } from '@/i18n/navigation';
import { getLocale } from 'next-intl/server';

export default async function ModerationIndexPage() {
  const locale = await getLocale();
  redirect({ href: '/moderation/profile-reports', locale });
}
