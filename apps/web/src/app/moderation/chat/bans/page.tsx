import { redirect } from 'next/navigation';

export default function AdminChatBansRedirect() {
  redirect('/moderation/chat/bans');
}
