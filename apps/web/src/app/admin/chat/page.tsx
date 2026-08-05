import { redirect } from 'next/navigation';

export default function AdminChatRedirect() {
  redirect('/moderation/chat/channels');
}
