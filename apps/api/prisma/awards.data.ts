export interface SeedAward {
  name: string;
  slug: string;
  description: string;
  iconUrl: string;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const seedAwards: SeedAward[] = [
  {
    name: 'Поддержка проекта',
    slug: 'project-support',
    description: 'Выдано за поддержку проекта',
    iconUrl: '/awards/star.png',
    color: '#FFD700',
    rarity: 'epic',
  },
  {
    name: 'Подписка Плюс',
    slug: 'plus-subscription',
    description: 'Выдано за покупку подписки Плюс',
    iconUrl: '/awards/medal.png',
    color: '#FFB700',
    rarity: 'rare',
  },
  {
    name: 'Верификация',
    slug: 'verification',
    description: 'Выдано за пройденную верификацию',
    iconUrl: '/awards/shield.png',
    color: '#3B82F6',
    rarity: 'common',
  },
];
