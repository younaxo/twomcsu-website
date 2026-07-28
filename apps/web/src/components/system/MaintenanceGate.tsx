'use client';

import { MaintenancePage } from '@/components/system/MaintenancePage';
import { useIsUnderMaintenance } from '@/hooks/useSystemStatus';

/** Renders full-screen maintenance overlay for non-admin users. */
export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { active, maintenance } = useIsUnderMaintenance();

  if (active && maintenance) {
    return (
      <MaintenancePage
        title={maintenance.title}
        message={maintenance.message}
        estimatedEnd={maintenance.estimatedEnd}
      />
    );
  }

  return <>{children}</>;
}
