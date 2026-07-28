import { redirect } from 'next/navigation';

export default function AdminAuditLogRedirect() {
  redirect('/dashboard/audit-log');
}
