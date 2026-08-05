export interface SeedCustomEmoji {
  name: string;
  imageUrl: string;
  category: string;
  isAnimated?: boolean;
  isPremium?: boolean;
}

export const seedCustomEmojis: SeedCustomEmoji[] = [
  {
    name: 'twomc',
    imageUrl: '/emojis/custom/twomc.png',
    category: 'TWOMC',
  },
  {
    name: 'creeper',
    imageUrl: '/emojis/custom/creeper.png',
    category: 'TWOMC',
  },
  {
    name: 'diamond',
    imageUrl: '/emojis/custom/diamond.png',
    category: 'TWOMC',
  },
  {
    name: 'sword',
    imageUrl: '/emojis/custom/sword.png',
    category: 'TWOMC',
  },
  {
    name: 'heart-pixel',
    imageUrl: '/emojis/custom/heart-pixel.png',
    category: 'TWOMC',
  },
  {
    name: 'pickaxe',
    imageUrl: '/emojis/custom/pickaxe.png',
    category: 'TWOMC',
  },
  {
    name: 'steve',
    imageUrl: '/emojis/custom/steve.png',
    category: 'TWOMC',
  },
  {
    name: 'tnt',
    imageUrl: '/emojis/custom/tnt.png',
    category: 'TWOMC',
    isPremium: true,
  },
];
