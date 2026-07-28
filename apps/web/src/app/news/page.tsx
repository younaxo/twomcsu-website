import type { Metadata } from 'next';
import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export const metadata: Metadata = {
  title: 'Новости — twomc.su',
};

export default function NewsPage() {
  return <ComingSoonPage title="Новости" description="Лента новостей проекта скоро появится." />;
}
