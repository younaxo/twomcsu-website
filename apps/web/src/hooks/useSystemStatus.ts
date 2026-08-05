'use client';

import { RoleGroup, hasRoleGroup } from '@twomc/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export type SystemAnnouncement = {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isDismissible: boolean;
  showFrom: string | null;
  showUntil: string | null;
  targetRole: string | null;
  order: number;
};

export type SystemStatus = {
  maintenance: {
    isEnabled: boolean;
    title: string;
    message: string;
    estimatedEnd: string | null;
  };
  disabledModules: Array<{ module: string; reason: string | null }>;
  announcements: SystemAnnouncement[];
};

export function useSystemStatus() {
  return useQuery({
    queryKey: ['system', 'status'],
    queryFn: async () => {
      const { data } = await api.get<SystemStatus>('/system/status', {
        skipAuthRedirect: true,
      });
      return data;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useIsModuleDisabled(module: string) {
  const { data } = useSystemStatus();
  const entry = data?.disabledModules.find((m) => m.module === module);
  return {
    disabled: Boolean(entry),
    reason: entry?.reason ?? null,
  };
}

export function useIsUnderMaintenance() {
  const { user } = useAuth();
  const { data, isLoading } = useSystemStatus();
  const isAdmin = user ? hasRoleGroup(user.roleGroup, RoleGroup.ADMIN) : false;
  const active = Boolean(data?.maintenance.isEnabled) && !isAdmin;
  return { active, isLoading, maintenance: data?.maintenance ?? null };
}
