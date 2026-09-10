import { redirect } from '@/i18n/navigation';
import { getLocale } from 'next-intl/server';

export default async function AdminStoreCurrenciesRedirect() {
  const locale = await getLocale();
  redirect({ href: '/dashboard/store/currencies', locale });
}
