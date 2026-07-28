import type { Metadata } from 'next';
import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export const metadata: Metadata = {
  title: 'Вики — twomc.su',
};

export default function WikiPage() {
  return (
    <ComingSoonPage
      title="Вики"
      description="Справочник по серверам и механикам в разработке."
    />
  );
}
