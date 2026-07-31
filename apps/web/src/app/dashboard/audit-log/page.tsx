import { redirect } from 'next/navigation';

export default function DashboardAuditLogRedirect() {
  redirect('/admin/audit-log');
}
