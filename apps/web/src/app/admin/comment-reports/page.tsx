import { redirect } from 'next/navigation';

export default function RedirectPage() {
  redirect('/moderation/comment-reports');
}
