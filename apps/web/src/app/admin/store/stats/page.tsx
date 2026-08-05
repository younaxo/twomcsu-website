import { redirect } from 'next/navigation';

export default function AdminStoreStatsRedirect() {
  redirect('/dashboard/store/stats');
}
