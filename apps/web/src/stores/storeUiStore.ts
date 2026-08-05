import type { ProductType } from '@twomc/shared';
import { create } from 'zustand';

export type StoreSort = 'popular' | 'price_asc' | 'price_desc' | 'newest';

interface StoreFilters {
  category: string | null;
  type: ProductType | null;
  sort: StoreSort;
}

interface StoreUiState {
  cartDrawerOpen: boolean;
  filters: StoreFilters;
  setCartDrawerOpen: (open: boolean) => void;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  setCategory: (category: string | null) => void;
  setType: (type: ProductType | null) => void;
  setSort: (sort: StoreSort) => void;
  resetFilters: () => void;
}

const defaultFilters: StoreFilters = {
  category: null,
  type: null,
  sort: 'popular',
};

export const useStoreUiStore = create<StoreUiState>((set) => ({
  cartDrawerOpen: false,
  filters: defaultFilters,

  setCartDrawerOpen: (open) => set({ cartDrawerOpen: open }),
  openCartDrawer: () => set({ cartDrawerOpen: true }),
  closeCartDrawer: () => set({ cartDrawerOpen: false }),

  setCategory: (category) =>
    set((state) => ({ filters: { ...state.filters, category } })),

  setType: (type) => set((state) => ({ filters: { ...state.filters, type } })),

  setSort: (sort) => set((state) => ({ filters: { ...state.filters, sort } })),

  resetFilters: () => set({ filters: defaultFilters }),
}));
