/**
 * Categories Store - Zustand state management
 * Manages hierarchical category tree and selection state
 */
import { create } from 'zustand';
import { fetchCategoryTree } from '../api';
import { CategoryTreeNode } from '../types';

export interface CategoriasState {
  // State
  categories: CategoryTreeNode[];
  loading: boolean;
  error: string | null;
  selectedCategoryId: string | null;

  // Actions
  fetchCategories: () => Promise<void>;
  setSelectedCategory: (id: string | null) => void;
  reset: () => void;
}

export const useCategoriasStore = create<CategoriasState>((set) => ({
  // Initial state
  categories: [],
  loading: false,
  error: null,
  selectedCategoryId: null,

  // Actions
  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      const categories = await fetchCategoryTree();
      set({ categories, loading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch categories';
      set({ error: errorMessage, loading: false });
    }
  },

  setSelectedCategory: (id: string | null) => {
    set({ selectedCategoryId: id });
  },

  reset: () => {
    set({
      categories: [],
      loading: false,
      error: null,
      selectedCategoryId: null,
    });
  },
}));
