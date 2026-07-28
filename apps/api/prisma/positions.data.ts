import { RoleGroup } from '@prisma/client';

export interface SeedPosition {
  name: string;
  slug: string;
  group: RoleGroup;
  color: string;
  priority: number;
  isDefault?: boolean;
}

/** Every group needs exactly one isDefault entry, new accounts land on it */
export const seedPositions: SeedPosition[] = [
  {
    name: 'Owner',
    slug: 'owner',
    group: RoleGroup.OWNER,
    color: '#FFD700',
    priority: 100,
    isDefault: true,
  },
  {
    name: 'Chief Curator',
    slug: 'chief-curator',
    group: RoleGroup.OWNER,
    color: '#FFD700',
    priority: 99,
  },
  {
    name: 'Senior Curator',
    slug: 'senior-curator',
    group: RoleGroup.OWNER,
    color: '#FFC700',
    priority: 98,
  },
  {
    name: 'Chief Developer',
    slug: 'chief-developer',
    group: RoleGroup.OWNER,
    color: '#FFB700',
    priority: 97,
  },
  { name: 'Curator', slug: 'curator', group: RoleGroup.OWNER, color: '#FFA700', priority: 96 },
  {
    name: 'Head PR Manager',
    slug: 'head-pr-manager',
    group: RoleGroup.OWNER,
    color: '#FF9700',
    priority: 95,
  },
  {
    name: 'Chief Technical Administrator',
    slug: 'chief-technical-administrator',
    group: RoleGroup.OWNER,
    color: '#FF8700',
    priority: 94,
  },
  {
    name: 'Head Developer',
    slug: 'head-developer',
    group: RoleGroup.OWNER,
    color: '#FF7700',
    priority: 93,
  },

  {
    name: 'Special Administrator',
    slug: 'special-administrator',
    group: RoleGroup.ADMIN,
    color: '#FF4444',
    priority: 90,
    isDefault: true,
  },
  { name: 'Developer', slug: 'developer', group: RoleGroup.ADMIN, color: '#9B59B6', priority: 89 },
  {
    name: 'Chief Administrator',
    slug: 'chief-administrator',
    group: RoleGroup.ADMIN,
    color: '#E74C3C',
    priority: 88,
  },
  {
    name: 'PR Manager',
    slug: 'pr-manager',
    group: RoleGroup.ADMIN,
    color: '#8E44AD',
    priority: 87,
  },
  {
    name: 'Technical Administrator',
    slug: 'technical-administrator',
    group: RoleGroup.ADMIN,
    color: '#C0392B',
    priority: 86,
  },

  {
    name: 'Head Cheat Hunter',
    slug: 'head-cheat-hunter',
    group: RoleGroup.MODERATOR,
    color: '#16A085',
    priority: 80,
    isDefault: true,
  },
  {
    name: 'Senior Administrator',
    slug: 'senior-administrator',
    group: RoleGroup.MODERATOR,
    color: '#2ECC71',
    priority: 79,
  },
  {
    name: 'Head PR Assistant',
    slug: 'head-pr-assistant',
    group: RoleGroup.MODERATOR,
    color: '#27AE60',
    priority: 78,
  },
  {
    name: 'Administrator',
    slug: 'administrator',
    group: RoleGroup.MODERATOR,
    color: '#3498DB',
    priority: 77,
  },
  {
    name: 'Junior Administrator',
    slug: 'junior-administrator',
    group: RoleGroup.MODERATOR,
    color: '#2980B9',
    priority: 76,
  },
  { name: 'Support', slug: 'support', group: RoleGroup.MODERATOR, color: '#1ABC9C', priority: 75 },
  {
    name: 'Cheat Hunter',
    slug: 'cheat-hunter',
    group: RoleGroup.MODERATOR,
    color: '#16A085',
    priority: 74,
  },
  {
    name: 'Chief Moderator',
    slug: 'chief-moderator',
    group: RoleGroup.MODERATOR,
    color: '#27AE60',
    priority: 73,
  },
  {
    name: 'Senior Moderator',
    slug: 'senior-moderator',
    group: RoleGroup.MODERATOR,
    color: '#2ECC71',
    priority: 72,
  },
  {
    name: 'PR Assistant',
    slug: 'pr-assistant',
    group: RoleGroup.MODERATOR,
    color: '#3498DB',
    priority: 71,
  },
  {
    name: 'Moderator',
    slug: 'moderator',
    group: RoleGroup.MODERATOR,
    color: '#2980B9',
    priority: 70,
  },
  {
    name: 'Junior Moderator',
    slug: 'junior-moderator',
    group: RoleGroup.MODERATOR,
    color: '#1ABC9C',
    priority: 69,
  },

  {
    name: 'Chief Helper',
    slug: 'chief-helper',
    group: RoleGroup.HELPER,
    color: '#00BCD4',
    priority: 60,
    isDefault: true,
  },
  {
    name: 'Senior Helper',
    slug: 'senior-helper',
    group: RoleGroup.HELPER,
    color: '#00ACC1',
    priority: 59,
  },
  { name: 'Helper', slug: 'helper', group: RoleGroup.HELPER, color: '#0097A7', priority: 58 },
  {
    name: 'Junior Helper',
    slug: 'junior-helper',
    group: RoleGroup.HELPER,
    color: '#00838F',
    priority: 57,
  },

  {
    name: 'Default',
    slug: 'default',
    group: RoleGroup.PLAYER,
    color: '#95A5A6',
    priority: 0,
    isDefault: true,
  },
  { name: 'Ares', slug: 'ares', group: RoleGroup.PLAYER, color: '#C0392B', priority: 55 },
  { name: 'Deimos', slug: 'deimos', group: RoleGroup.PLAYER, color: '#E74C3C', priority: 50 },
  { name: 'Apollon', slug: 'apollon', group: RoleGroup.PLAYER, color: '#F1C40F', priority: 40 },
  { name: 'Kratos', slug: 'kratos', group: RoleGroup.PLAYER, color: '#D35400', priority: 30 },
  { name: 'Svarog', slug: 'svarog', group: RoleGroup.PLAYER, color: '#E67E22', priority: 20 },
  { name: 'Gefest', slug: 'gefest', group: RoleGroup.PLAYER, color: '#7F8C8D', priority: 15 },
  {
    name: 'Polemicism',
    slug: 'polemicism',
    group: RoleGroup.PLAYER,
    color: '#F39C12',
    priority: 10,
  },
];
