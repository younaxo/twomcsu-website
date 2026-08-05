import { redirect } from 'next/navigation';

export default function AdminOrdersStatsRedirect() {
  redirect('/dashboard/orders/stats');
}
