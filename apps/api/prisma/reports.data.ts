import type { PunishmentType, ReportType, ReportStatus } from '@prisma/client';

export type SeedReportTarget = {
  username: string;
  order?: number;
};

export type SeedEvidenceLink = {
  url: string;
  title?: string;
  type?: string;
  order?: number;
};

export type SeedReport = {
  reportNumber: string;
  type: ReportType;
  status: ReportStatus;
  authorUsername: string;
  targets?: SeedReportTarget[];
  evidenceLinks?: SeedEvidenceLink[];
  server?: string;
  incidentDate?: Date;
  description: string;
  descriptionHtml: string;
  additionalText?: string;
  assignedToUsername?: string;
  appealedPunishmentKey?: string;
};

export type SeedPunishment = {
  key: string;
  username: string;
  punishmentType: PunishmentType;
  reason: string;
  duration?: string;
  server?: string;
  issuedByUsername: string;
  issuedAt: Date;
  expiresAt?: Date | null;
  isActive: boolean;
  isAppealable: boolean;
};

export const seedPunishments: SeedPunishment[] = [
  {
    key: 'mute-player1-expired',
    username: 'player1',
    punishmentType: 'MUTE',
    reason: 'Флуд в общем чате',
    duration: '1h',
    server: 'survival',
    issuedByUsername: 'moderator',
    issuedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
    isActive: false,
    isAppealable: true,
  },
  {
    key: 'tempban-player2-active',
    username: 'player2',
    punishmentType: 'TEMPBAN',
    reason: 'Читы / килл-аура',
    duration: '7d',
    server: 'survival',
    issuedByUsername: 'admin',
    issuedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    isActive: true,
    isAppealable: true,
  },
  {
    key: 'warn-player1-expired',
    username: 'player1',
    punishmentType: 'WARN',
    reason: 'Оскорбление игроков',
    server: 'anarchy',
    issuedByUsername: 'helper',
    issuedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    expiresAt: null,
    isActive: false,
    isAppealable: true,
  },
];

export const seedReports: SeedReport[] = [
  {
    reportNumber: '10R-a1b2c',
    type: 'PLAYER_COMPLAINT',
    status: 'PENDING',
    authorUsername: 'player1',
    targets: [
      { username: 'player2', order: 0 },
      { username: 'NotOnSiteYet', order: 1 },
      { username: 'CheaterAlt', order: 2 },
    ],
    evidenceLinks: [
      {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Основное видео',
        type: 'youtube',
        order: 0,
      },
      {
        url: 'https://imgur.com/gallery/example',
        title: 'Скриншот инвентаря',
        type: 'imgur',
        order: 1,
      },
    ],
    server: 'survival',
    incidentDate: new Date(Date.now() - 12 * 60 * 60 * 1000),
    description:
      'Игроки используют читы на выживании: полёт и килл-ауру. Видео и скриншоты приложены.',
    descriptionHtml:
      '<p>Игроки используют читы на выживании: полёт и килл-ауру. Видео и скриншоты приложены.</p>',
    additionalText: 'Нарушение повторялось несколько раз за вечер.',
  },
  {
    reportNumber: '10R-d3e4f',
    type: 'TECHNICAL_ISSUE',
    status: 'IN_REVIEW',
    authorUsername: 'player2',
    server: 'anarchy',
    description:
      'Не могу подключиться к анархии: таймаут после логина. Уже перезапускал лаунчер.',
    descriptionHtml:
      '<p>Не могу подключиться к анархии: таймаут после логина. Уже перезапускал лаунчер.</p>',
    assignedToUsername: 'helper',
  },
  {
    reportNumber: '10R-f5a6b',
    type: 'PUNISHMENT_APPEAL',
    status: 'WAITING_RESPONSE',
    authorUsername: 'player1',
    appealedPunishmentKey: 'mute-player1-expired',
    evidenceLinks: [
      {
        url: 'https://youtu.be/dQw4w9WgXcQ',
        title: 'Запись чата',
        type: 'youtube',
        order: 0,
      },
    ],
    description:
      'Прошу снять мут: наказание выдано по ошибке, я не писал в чат то, что указано в причине.',
    descriptionHtml:
      '<p>Прошу снять мут: наказание выдано по ошибке, я не писал в чат то, что указано в причине.</p>',
    assignedToUsername: 'moderator',
  },
  {
    reportNumber: '10R-c7d8e',
    type: 'ADMIN_COMPLAINT',
    status: 'PENDING',
    authorUsername: 'player2',
    targets: [{ username: 'helper', order: 0 }],
    evidenceLinks: [
      {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Запись разговора',
        type: 'youtube',
        order: 0,
      },
    ],
    server: 'survival',
    description:
      'Хелпер грубо общался и отказал в помощи без объяснения причин. Есть запись разговора.',
    descriptionHtml:
      '<p>Хелпер грубо общался и отказал в помощи без объяснения причин. Есть запись разговора.</p>',
  },
  {
    reportNumber: '10R-e9f0a',
    type: 'OTHER',
    status: 'RESOLVED',
    authorUsername: 'player1',
    description: 'Вопрос по сотрудничеству и партнёрской программе для медиа.',
    descriptionHtml: '<p>Вопрос по сотрудничеству и партнёрской программе для медиа.</p>',
    assignedToUsername: 'admin',
  },
];
