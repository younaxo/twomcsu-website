import type { Metadata } from 'next';
import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

// TODO: Tickets — переименовать в "Обращения"
export const metadata: Metadata = {
  title: 'Обращения — twomc.su',
};

export default function SupportPage() {
  return (
    <ComingSoonPage
      title="Обращения"
      description="Система обращений в поддержку скоро будет доступна."
    />
  );
}
