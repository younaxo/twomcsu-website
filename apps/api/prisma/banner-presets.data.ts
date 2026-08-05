export interface SeedBannerPreset {
  name: string;
  imageUrl: string;
  category: string;
}

/// picsum keeps the seed offline free, swap the urls once the art is ready
export const seedBannerPresets: SeedBannerPreset[] = [
  { name: 'Каменный карьер', imageUrl: 'https://picsum.photos/1920/480?random=1', category: 'minecraft' },
  { name: 'Ночная шахта', imageUrl: 'https://picsum.photos/1920/480?random=2', category: 'minecraft' },
  { name: 'Хвойный лес', imageUrl: 'https://picsum.photos/1920/480?random=3', category: 'nature' },
  { name: 'Горный хребет', imageUrl: 'https://picsum.photos/1920/480?random=4', category: 'nature' },
  { name: 'Рассвет над озером', imageUrl: 'https://picsum.photos/1920/480?random=5', category: 'nature' },
  { name: 'Плавные волны', imageUrl: 'https://picsum.photos/1920/480?random=6', category: 'abstract' },
  { name: 'Геометрия', imageUrl: 'https://picsum.photos/1920/480?random=7', category: 'abstract' },
  { name: 'Тёмный космос', imageUrl: 'https://picsum.photos/1920/480?random=8', category: 'dark' },
  { name: 'Глубина', imageUrl: 'https://picsum.photos/1920/480?random=9', category: 'dark' },
  { name: 'Неоновый закат', imageUrl: 'https://picsum.photos/1920/480?random=10', category: 'colorful' },
];
