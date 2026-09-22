import { redirect } from '@/i18n/navigation';
import { getLocale } from 'next-intl/server';

export default async function DashboardAuditLogRedirect() {
  const locale = await getLocale();
  redirect({ href: '/admin/audit-log', locale });
}
