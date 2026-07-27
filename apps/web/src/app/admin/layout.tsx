'use client';

import { RoleGroup, hasRoleGroup } from '@twomc/shared';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';

/** Middleware only checks the cookie, the role itself is verified here and on the api */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const allowed = user ? hasRoleGroup(user.roleGroup, RoleGroup.ADMIN) : false;

  useEffect(() => {
    if (isLoading || allowed) {
      return;
    }

    toast.error('Недостаточно прав');
    router.replace('/');
  }, [allowed, isLoading, router]);

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return allowed ? <>{children}</> : null;
}
