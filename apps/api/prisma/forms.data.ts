import { FormFieldType, FormStatus, FormVisibility } from '@prisma/client';

export interface SeedFormField {
  type: FormFieldType;
  label: string;
  description?: string;
  placeholder?: string;
  isRequired?: boolean;
  order: number;
  options?: unknown;
  validation?: unknown;
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  maxFiles?: number;
  maxFileSize?: number;
  allowedMimes?: string[];
  metadata?: unknown;
  defaultValue?: string;
}

export interface SeedFormItem {
  slug: string;
  title: string;
  description: string;
  status: FormStatus;
  visibility: FormVisibility;
  onePerUser?: boolean;
  showResults?: boolean;
  requiresAuth?: boolean;
  requiresCaptcha?: boolean;
  thankYouMessage?: string;
  isTemplate?: boolean;
  fields: SeedFormField[];
}

/** Demo forms + reusable admin templates */
export const seedForms: SeedFormItem[] = [
  {
    slug: 'moderator-application',
    title: 'Заявка на модератора',
    description:
      'Заполните форму, если хотите присоединиться к команде модерации TWOMC. Укажите ник, доступность и мотивацию.',
    status: FormStatus.PUBLISHED,
    visibility: FormVisibility.AUTHENTICATED,
    onePerUser: true,
    requiresAuth: true,
    requiresCaptcha: true,
    thankYouMessage: 'Спасибо! Заявка отправлена. Мы свяжемся с вами в Discord или на сайте.',
    fields: [
      {
        type: FormFieldType.TEXT,
        label: 'Minecraft-ник',
        description: 'Заполняется автоматически из профиля',
        isRequired: true,
        order: 0,
        metadata: { autoFill: 'username' },
      },
      {
        type: FormFieldType.SCHEDULE_PICKER,
        label: 'Когда вы онлайн?',
        description: 'Отметьте дни и часы, когда можете модерировать',
        isRequired: true,
        order: 1,
        options: {
          days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
          hourStart: 10,
          hourEnd: 23,
        },
      },
      {
        type: FormFieldType.PLAYER_SELECTOR,
        label: 'Кто может вас рекомендовать?',
        description: 'Укажите игроков, которые могут подтвердить ваш опыт',
        isRequired: false,
        order: 2,
        metadata: { maxPlayers: 3, allowUnregistered: false },
      },
      {
        type: FormFieldType.SERVER_SELECTOR,
        label: 'Основной сервер',
        description: 'На каком режиме вы проводите больше всего времени?',
        isRequired: true,
        order: 3,
      },
      {
        type: FormFieldType.MARKDOWN_EDITOR,
        label: 'Почему вы хотите стать модератором?',
        description: 'Расскажите о мотивации и опыте',
        isRequired: true,
        order: 4,
        minLength: 100,
        maxLength: 3000,
      },
      {
        type: FormFieldType.RATING,
        label: 'Насколько хорошо вы знаете правила?',
        isRequired: true,
        order: 5,
        metadata: { maxStars: 5 },
        minValue: 1,
        maxValue: 5,
      },
      {
        type: FormFieldType.AGREEMENT_CHECKLIST,
        label: 'Соглашения',
        isRequired: true,
        order: 6,
        options: {
          items: [
            'Я ознакомился(ась) с правилами сервера',
            'Я обязуюсь быть объективным(ой) и вежливым(ой)',
            'Я понимаю, что должность можно потерять за нарушения',
          ],
        },
      },
    ],
  },
  {
    slug: 'player-survey',
    title: 'Опрос игроков',
    description:
      'Помогите нам сделать сервер лучше. Анонимный опрос займёт пару минут.',
    status: FormStatus.PUBLISHED,
    visibility: FormVisibility.PUBLIC,
    onePerUser: false,
    showResults: true,
    requiresAuth: false,
    requiresCaptcha: true,
    thankYouMessage: 'Спасибо за отзыв! Результаты опроса доступны на странице формы.',
    fields: [
      {
        type: FormFieldType.RATING,
        label: 'Насколько вы довольны сервером?',
        isRequired: true,
        order: 0,
        metadata: { maxStars: 5 },
        minValue: 1,
        maxValue: 5,
      },
      {
        type: FormFieldType.CHECKBOX,
        label: 'Что вам нравится больше всего?',
        isRequired: true,
        order: 1,
        options: {
          choices: [
            'Сообщество',
            'Ивенты',
            'Экономика',
            'Стройки',
            'Мини-игры',
            'Модерация',
          ],
        },
      },
      {
        type: FormFieldType.RANK_SELECTOR,
        label: 'Какой ранг хотите следующим?',
        isRequired: false,
        order: 2,
      },
      {
        type: FormFieldType.PRODUCT_SELECTOR,
        label: 'Что хотите видеть в магазине?',
        isRequired: false,
        order: 3,
      },
      {
        type: FormFieldType.MARKDOWN_EDITOR,
        label: 'Ваши предложения',
        placeholder: 'Идеи по улучшению сервера...',
        isRequired: false,
        order: 4,
        maxLength: 2000,
      },
    ],
  },
  {
    slug: 'build-contest',
    title: 'Конкурс построек',
    description:
      'Подайте работу на конкурс построек TWOMC. Прикрепите скриншоты и описание.',
    status: FormStatus.PUBLISHED,
    visibility: FormVisibility.AUTHENTICATED,
    onePerUser: true,
    requiresAuth: true,
    requiresCaptcha: true,
    thankYouMessage: 'Работа принята! Результаты конкурса опубликуем в новостях.',
    fields: [
      {
        type: FormFieldType.TEXT,
        label: 'Minecraft-ник',
        isRequired: true,
        order: 0,
        metadata: { autoFill: 'username' },
      },
      {
        type: FormFieldType.SERVER_SELECTOR,
        label: 'Сервер постройки',
        isRequired: true,
        order: 1,
      },
      {
        type: FormFieldType.TEXT,
        label: 'Название постройки',
        isRequired: true,
        order: 2,
        minLength: 3,
        maxLength: 100,
      },
      {
        type: FormFieldType.MARKDOWN_EDITOR,
        label: 'Описание',
        description: 'Расскажите историю и особенности постройки',
        isRequired: true,
        order: 3,
        minLength: 50,
        maxLength: 5000,
      },
      {
        type: FormFieldType.IMAGE_GALLERY,
        label: 'Скриншоты',
        description: 'До 10 изображений',
        isRequired: true,
        order: 4,
        maxFiles: 10,
        maxFileSize: 5 * 1024 * 1024,
        allowedMimes: ['image/jpeg', 'image/png', 'image/webp'],
        metadata: { maxImages: 10 },
      },
      {
        type: FormFieldType.VIDEO_URL,
        label: 'Видео-обзор (опционально)',
        placeholder: 'https://youtube.com/watch?v=...',
        isRequired: false,
        order: 5,
      },
      {
        type: FormFieldType.PLAYER_SELECTOR,
        label: 'Соавторы',
        isRequired: false,
        order: 6,
        metadata: { maxPlayers: 5, allowUnregistered: true },
      },
    ],
  },
];

/** Extra templates available via «Создать из шаблона» (not published by default) */
export const seedFormTemplates: SeedFormItem[] = [
  {
    slug: 'template-media-partner',
    title: 'Заявка на медиа партнёра',
    description: 'Шаблон заявки для YouTube / Twitch / TikTok партнёров.',
    status: FormStatus.DRAFT,
    visibility: FormVisibility.AUTHENTICATED,
    onePerUser: true,
    requiresAuth: true,
    isTemplate: true,
    thankYouMessage: 'Заявка на медиа-партнёрство отправлена.',
    fields: [
      {
        type: FormFieldType.TEXT,
        label: 'Minecraft-ник',
        isRequired: true,
        order: 0,
        metadata: { autoFill: 'username' },
      },
      {
        type: FormFieldType.URL,
        label: 'Ссылка на канал',
        isRequired: true,
        order: 1,
      },
      {
        type: FormFieldType.NUMBER,
        label: 'Подписчиков',
        isRequired: true,
        order: 2,
        minValue: 0,
      },
      {
        type: FormFieldType.MARKDOWN_EDITOR,
        label: 'О себе и контенте',
        isRequired: true,
        order: 3,
        minLength: 100,
      },
      {
        type: FormFieldType.AGREEMENT_CHECKLIST,
        label: 'Соглашения',
        isRequired: true,
        order: 4,
        options: {
          items: [
            'Контент соответствует правилам TWOMC',
            'Готов(а) указывать ссылку на сервер',
          ],
        },
      },
    ],
  },
  {
    slug: 'template-event-registration',
    title: 'Регистрация на ивент',
    description: 'Шаблон регистрации участников на мероприятие.',
    status: FormStatus.DRAFT,
    visibility: FormVisibility.AUTHENTICATED,
    onePerUser: true,
    requiresAuth: true,
    isTemplate: true,
    fields: [
      {
        type: FormFieldType.TEXT,
        label: 'Ник',
        isRequired: true,
        order: 0,
        metadata: { autoFill: 'username' },
      },
      {
        type: FormFieldType.SERVER_SELECTOR,
        label: 'Сервер',
        isRequired: true,
        order: 1,
      },
      {
        type: FormFieldType.SCHEDULE_PICKER,
        label: 'Удобное время',
        isRequired: false,
        order: 2,
      },
      {
        type: FormFieldType.CHECKBOX,
        label: 'Роль на ивенте',
        isRequired: true,
        order: 3,
        options: { choices: ['Участник', 'Зритель', 'Помощник'] },
      },
    ],
  },
  {
    slug: 'template-bug-report',
    title: 'Багрепорт расширенный',
    description: 'Подробный шаблон для сообщений о багах.',
    status: FormStatus.DRAFT,
    visibility: FormVisibility.AUTHENTICATED,
    onePerUser: false,
    requiresAuth: true,
    isTemplate: true,
    fields: [
      {
        type: FormFieldType.SELECT,
        label: 'Категория',
        isRequired: true,
        order: 0,
        options: {
          choices: ['Клиент', 'Сервер', 'Плагин', 'Сайт', 'Лаунчер'],
        },
      },
      {
        type: FormFieldType.SERVER_SELECTOR,
        label: 'Сервер',
        isRequired: false,
        order: 1,
      },
      {
        type: FormFieldType.TEXT,
        label: 'Краткое описание',
        isRequired: true,
        order: 2,
        maxLength: 120,
      },
      {
        type: FormFieldType.MARKDOWN_EDITOR,
        label: 'Шаги воспроизведения',
        isRequired: true,
        order: 3,
      },
      {
        type: FormFieldType.IMAGE_GALLERY,
        label: 'Скриншоты / видеокадры',
        isRequired: false,
        order: 4,
        maxFiles: 5,
        metadata: { maxImages: 5 },
      },
      {
        type: FormFieldType.CODE_EDITOR,
        label: 'Логи / стек',
        isRequired: false,
        order: 5,
        metadata: { language: 'text' },
      },
    ],
  },
  {
    slug: 'template-server-review',
    title: 'Отзыв о сервере',
    description: 'Шаблон отзыва игрока о конкретном режиме.',
    status: FormStatus.DRAFT,
    visibility: FormVisibility.PUBLIC,
    onePerUser: true,
    showResults: true,
    isTemplate: true,
    fields: [
      {
        type: FormFieldType.SERVER_SELECTOR,
        label: 'Сервер',
        isRequired: true,
        order: 0,
      },
      {
        type: FormFieldType.RATING,
        label: 'Оценка',
        isRequired: true,
        order: 1,
        metadata: { maxStars: 5 },
      },
      {
        type: FormFieldType.MARKDOWN_EDITOR,
        label: 'Отзыв',
        isRequired: true,
        order: 2,
        minLength: 30,
      },
    ],
  },
];
