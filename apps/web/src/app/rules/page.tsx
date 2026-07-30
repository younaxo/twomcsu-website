'use client';

import { TopicCategory } from '@twomc/shared';
import { TopicsListPage } from '@/components/topics/TopicsListPage';

export default function RulesPage() {
  return (
    <TopicsListPage
      title="Правила"
      description="Правила сервера и сообщества"
      category={TopicCategory.RULES}
      hrefPrefix="/rules"
    />
  );
}
