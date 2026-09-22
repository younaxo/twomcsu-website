'use client';

import { MaintenancePage } from '@/components/system/MaintenancePage';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { Skeleton } from '@/components/ui/skeleton';

export default function MaintenanceRoutePage() {
  const { data, isLoading } = useSystemStatus();

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Skeleton className="h-64 w-full max-w-lg rounded-2xl" />
      </div>
    );
  }

  return (
    <MaintenancePage
      title={data.maintenance.title}
      message={data.maintenance.message}
      estimatedEnd={data.maintenance.estimatedEnd}
    />
  );
}
