import { redirect } from 'next/navigation';

export default function AdminChatSettingsRedirect() {
  redirect('/moderation/chat/settings');
}
