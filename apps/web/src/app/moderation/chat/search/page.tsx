import { redirect } from 'next/navigation';

export default function AdminChatSearchRedirect() {
  redirect('/moderation/chat/search');
}
