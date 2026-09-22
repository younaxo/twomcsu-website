import { redirect } from '@/i18n/navigation';
import { getLocale } from 'next-intl/server';

export default async function AdminStoreStatsRedirect() {
  const locale = await getLocale();
  redirect({ href: '/dashboard/store/stats', locale });
}
