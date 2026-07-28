import { redirect } from 'next/navigation';

export default function AdminAnnouncementsRedirect() {
  redirect('/dashboard/announcements');
}
