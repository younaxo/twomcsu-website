import type { ReportType, ReportStatus } from '@prisma/client';

export type SeedReport = {
  reportNumber: string;
  type: ReportType;
  status: ReportStatus;
  authorUsername: string;
  targetUsername?: string;
  server?: string;
  incidentDate?: Date;
  description: string;
  descriptionHtml: string;
  evidenceLinks: string[];
  assignedToUsername?: string;
};

export const seedReports: SeedReport[] = [
  {
    reportNumber: '10R-a1b2c',
    type: 'PLAYER_COMPLAINT',
    status: 'PENDING',
    authorUsername: 'player1',
    targetUsername: 'player2',
    server: 'survival',
    incidentDate: new Date(Date.now() - 12 * 60 * 60 * 1000),
    description:
      'Игрок использует читы на выживании: полёт и килл-ауру. Видео приложено.',
    descriptionHtml:
      '<p>Игрок использует читы на выживании: полёт и килл-ауру. Видео приложено.</p>',
    evidenceLinks: ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
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
    evidenceLinks: [],
    assignedToUsername: 'helper',
  },
  {
    reportNumber: '10R-f5a6b',
    type: 'PUNISHMENT_APPEAL',
    status: 'WAITING_RESPONSE',
    authorUsername: 'player1',
    description:
      'Прошу снять мут: наказание выдано по ошибке, я не писал в чат то, что указано в причине.',
    descriptionHtml:
      '<p>Прошу снять мут: наказание выдано по ошибке, я не писал в чат то, что указано в причине.</p>',
    evidenceLinks: ['https://youtu.be/dQw4w9WgXcQ'],
    assignedToUsername: 'moderator',
  },
  {
    reportNumber: '10R-c7d8e',
    type: 'ADMIN_COMPLAINT',
    status: 'PENDING',
    authorUsername: 'player2',
    targetUsername: 'helper',
    server: 'survival',
    description:
      'Хелпер грубо общался и отказал в помощи без объяснения причин. Есть запись разговора.',
    descriptionHtml:
      '<p>Хелпер грубо общался и отказал в помощи без объяснения причин. Есть запись разговора.</p>',
    evidenceLinks: ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
  },
  {
    reportNumber: '10R-e9f0a',
    type: 'OTHER',
    status: 'RESOLVED',
    authorUsername: 'player1',
    description: 'Вопрос по сотрудничеству и партнёрской программе для медиа.',
    descriptionHtml: '<p>Вопрос по сотрудничеству и партнёрской программе для медиа.</p>',
    evidenceLinks: [],
    assignedToUsername: 'admin',
  },
];
