export interface CustomEmoji {
  id: string;
  name: string;
  imageUrl: string;
  category: string | null;
  isAnimated: boolean;
  isPremium: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomEmojiInput {
  name: string;
  category?: string;
  isAnimated?: boolean;
  isPremium?: boolean;
}

export interface UpdateCustomEmojiInput {
  name?: string;
  category?: string | null;
  isAnimated?: boolean;
  isPremium?: boolean;
  isActive?: boolean;
}
