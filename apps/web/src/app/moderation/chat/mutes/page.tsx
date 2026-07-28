import { redirect } from 'next/navigation';

export default function AdminChatMutesRedirect() {
  redirect('/moderation/chat/mutes');
}
