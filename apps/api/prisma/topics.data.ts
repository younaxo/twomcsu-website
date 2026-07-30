export const TOPIC_PLACEHOLDER_CONTENT =
  'Здесь будет текст. Владелец сайта заполнит этот раздел.';

export const seedTopics = [
  {
    slug: 'game-rules',
    title: 'Правила игры',
    category: 'RULES' as const,
    visibility: 'PUBLIC' as const,
    description: 'Основные правила поведения на сервере',
    order: 0,
  },
  {
    slug: 'chat-rules',
    title: 'Правила чата',
    category: 'RULES' as const,
    visibility: 'PUBLIC' as const,
    description: 'Общение в игре и на сайте',
    order: 1,
  },
  {
    slug: 'public-offer',
    title: 'Публичная оферта',
    category: 'DOCUMENTS' as const,
    visibility: 'PUBLIC' as const,
    description: 'Условия оказания услуг',
    order: 0,
  },
  {
    slug: 'privacy-policy',
    title: 'Политика конфиденциальности',
    category: 'DOCUMENTS' as const,
    visibility: 'PUBLIC' as const,
    description: 'Обработка персональных данных',
    order: 1,
  },
  {
    slug: 'moderator-guidelines',
    title: 'Руководство для модераторов',
    category: 'RULES' as const,
    visibility: 'HELPER_ONLY' as const,
    description: 'Внутренние инструкции для команды модерации',
    order: 2,
  },
  {
    slug: 'internal-procedures',
    title: 'Внутренние процедуры',
    category: 'ADMIN_INTERNAL' as const,
    visibility: 'ADMIN_ONLY' as const,
    description: 'Регламент работы администрации',
    order: 0,
  },
];
