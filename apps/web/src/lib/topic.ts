import type { TopicCategory, TopicVisibility } from '@twomc/shared';

export const TOPIC_CATEGORY_LABELS: Record<TopicCategory, string> = {
  RULES: 'Правила',
  DOCUMENTS: 'Документы',
  INFORMATION: 'Информация',
  ADMIN_INTERNAL: 'Внутреннее',
  FAQ: 'FAQ',
  ANNOUNCEMENT: 'Объявления',
  OTHER: 'Прочее',
};

export const TOPIC_VISIBILITY_LABELS: Record<TopicVisibility, string> = {
  PUBLIC: 'Публично',
  AUTHENTICATED: 'Авторизованные',
  HELPER_ONLY: 'Хелперы',
  MODERATOR_ONLY: 'Модераторы',
  ADMIN_ONLY: 'Администраторы',
  OWNER_ONLY: 'Владелец',
};

export function slugifyTopicTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/^-|-$/g, '');
}

export function extractMarkdownHeadings(content: string): { id: string; text: string; level: 2 | 3 }[] {
  const headings: { id: string; text: string; level: 2 | 3 }[] = [];

  for (const line of content.split('\n')) {
    const match = /^(#{2,3})\s+(.+)$/.exec(line.trim());
    if (!match) continue;

    const level = match[1].length as 2 | 3;
    const text = match[2].replace(/[#*`[\]]/g, '').trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9а-яё\s-]/gi, '')
      .trim()
      .replace(/\s+/g, '-');

    if (id) {
      headings.push({ id, text, level });
    }
  }

  return headings;
}
