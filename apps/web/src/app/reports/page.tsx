import type { Metadata } from 'next';
import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export const metadata: Metadata = {
  title: 'Репорты — twomc.su',
};

export default function ReportsPage() {
  return (
    <ComingSoonPage
      title="Репорты"
      description="Жалобы на игроков и нарушения — раздел в разработке."
    />
  );
}
