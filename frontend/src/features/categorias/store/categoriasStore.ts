/**
 * Categories Zustand Store
 * Manages category state and actions for the entire application
 */
import { create } from 'zustand';
import { CategoryTreeNode } from '../types';
import { fetchCategoryTree } from '../api';

/**
 * State interface for categories store
 */
export interface CategoriasState {
  // State
  categories: CategoryTreeNode[];
  loading: boolean;
  error: string | null;
  selectedCategoryId: string | null;
  lastFetchTime: number | null;

  // Actions
  fetchCategories: (forceRefresh?: boolean) => Promise<void>;
  setSelectedCategory: (id: string | null) => void;
  reset: () => void;
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Create and export the categories store
 * Includes caching to prevent unnecessary API calls
 */
export const useCategoriasStore = create<CategoriasState>((set, get) => ({
  // Initial state
  categories: [],
  loading: false,
  error: null,
  selectedCategoryId: null,
  lastFetchTime: null,

  /**
   * Fetch categories from API with caching
   * @param forceRefresh - Bypass cache and fetch fresh data
   */
  fetchCategories: async (forceRefresh = false) => {
    const state = get();

    // Check cache: if we have data and it's fresh, skip fetch
    if (
      !forceRefresh &&
      state.categories.length > 0 &&
      state.lastFetchTime &&
      Date.now() - state.lastFetchTime < CACHE_DURATION
    ) {
      return;
    }

    // Start loading
    set({ loading: true, error: null });

    try {
      const data = await fetchCategoryTree();
      set({
        categories: data,
        loading: false,
        error: null,
        lastFetchTime: Date.now(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      set({
        loading: false,
        error: errorMessage,
        categories: [],
      });
      throw err;
    }
  },

  /**
   * Set the currently selected category
   * @param id - Category ID or null to deselect
   */
  setSelectedCategory: (id: string | null) => {
    set({ selectedCategoryId: id });
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set({
      categories: [],
      loading: false,
      error: null,
      selectedCategoryId: null,
      lastFetchTime: null,
    });
  },
}));

export default useCategoriasStore;
