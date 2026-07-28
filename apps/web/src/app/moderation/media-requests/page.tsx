import { redirect } from 'next/navigation';

export default function AdminMediaRequestsRedirect() {
  redirect('/moderation/media-requests');
}
