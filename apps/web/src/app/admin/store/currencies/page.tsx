import { redirect } from 'next/navigation';

export default function AdminStoreCurrenciesRedirect() {
  redirect('/dashboard/store/currencies');
}
