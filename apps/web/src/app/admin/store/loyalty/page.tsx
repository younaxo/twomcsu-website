import { redirect } from 'next/navigation';

export default function AdminStoreLoyaltyRedirect() {
  redirect('/dashboard/store/loyalty');
}
