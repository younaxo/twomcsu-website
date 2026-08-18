'use client';

import { CalendarClock, MessageCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useGroupInvite, useJoinGroupInvite } from '@/hooks/useDirectMessages';
import { extractErrorMessage } from '@/lib/api';

export default function GroupInvitePage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = params?.code ?? '';
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const invite = useGroupInvite(code);
  const join = useJoinGroupInvite();

  if (invite.isLoading) {
    return <Skeleton className="mx-auto h-80 max-w-xl rounded-2xl" />;
  }

  if (invite.isError || !invite.data) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl p-8 text-center glass-strong">
        <h1 className="text-2xl font-semibold">Приглашение недействительно</h1>
        <p className="mt-2 text-sm text-muted-foreground">Ссылка не найдена, отозвана или её срок действия истёк.</p>
        <Button asChild variant="secondary" className="mt-6"><Link href="/">На главную</Link></Button>
      </div>
    );
  }

  const data = invite.data;
  const joinGroup = async () => {
    if (!isAuthenticated) {
      router.push(`/login?returnUrl=${encodeURIComponent(`/g/${code}`)}`);
      return;
    }
    try {
      const conversation = await join.mutateAsync(code);
      toast.success(`Вы присоединились к группе «${conversation.title}»`);
      router.push(`/messages?conversation=${conversation.id}`);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось присоединиться к группе'));
    }
  };

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-white/10 p-6 text-center glass-strong sm:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <MessageCircle className="h-8 w-8" />
      </div>
      <p className="mt-5 text-xs font-medium uppercase tracking-wider text-primary">Приглашение в группу</p>
      <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{data.title}</h1>
      <div className="mt-5 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{data.membersCount} из 10 участников</span>
        {data.expiresAt ? (
          <span className="flex items-center gap-1.5"><CalendarClock className="h-4 w-4" />До {new Date(data.expiresAt).toLocaleString('ru-RU')}</span>
        ) : null}
      </div>
      {!data.available ? <p className="mt-6 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{data.reason}</p> : null}
      <Button className="mt-7 w-full" disabled={!data.available || join.isPending || authLoading} onClick={() => void joinGroup()}>
        {isAuthenticated ? 'Присоединиться' : 'Войти и присоединиться'}
      </Button>
    </div>
  );
}
