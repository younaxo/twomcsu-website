'use client';

import { RoleGroup, hasRoleGroup } from '@twomc/shared';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export function useRoleGuard(required: RoleGroup) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const allowed = user ? hasRoleGroup(user.roleGroup, required) : false;

  useEffect(() => {
    if (isLoading || allowed) {
      return;
    }

    toast.error('Недостаточно прав');
    router.replace('/');
  }, [allowed, isLoading, router]);

  return { isLoading, allowed };
}
