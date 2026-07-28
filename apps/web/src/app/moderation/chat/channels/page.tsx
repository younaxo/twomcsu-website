import { redirect } from 'next/navigation';

export default function AdminChatChannelsRedirect() {
  redirect('/moderation/chat/channels');
}
