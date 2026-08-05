'use client';

import { TopicCategory } from '@twomc/shared';
import { TopicsListPage } from '@/components/topics/TopicsListPage';

export default function DocumentsPage() {
  return (
    <TopicsListPage
      title="Документы"
      description="Юридические документы и официальные материалы"
      category={TopicCategory.DOCUMENTS}
      hrefPrefix="/documents"
    />
  );
}
