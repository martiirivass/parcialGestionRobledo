/**
 * Products Zustand store
 * Manages product list state, pagination, loading, and errors
 * Ephemeral state - no persistence, only in memory
 */

import { create } from 'zustand';
import {
  Product,
  ProductPublic,
  PaginationResponse,
  ProductFilters,
} from '../types';
import * as api from '../api';

/**
 * Store state interface
 */
interface ProductsState {
  // Data
  products: ProductPublic[];
  currentProduct: ProductPublic | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Pagination
  pagination: PaginationResponse & {
    page: number;
    limit: number;
  };
  
  // Actions
  fetchProducts: (filters?: ProductFilters) => Promise<void>;
  fetchProductById: (id: string) => Promise<void>;
  setCurrentProduct: (product: ProductPublic | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPagination: (pagination: PaginationResponse & { page: number; limit: number }) => void;
  clearProducts: () => void;
}

/**
 * Products store using Zustand
 * Handles state management for product catalog
 */
const useProductsStore = create<ProductsState>((set) => ({
  // Initial state
  products: [],
  currentProduct: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },

  /**
   * Fetch products with optional filters
   * Updates products array and pagination metadata
   */
  fetchProducts: async (filters?: ProductFilters) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.getProducts(filters);
      
      set({
        products: response.data,
        pagination: {
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages,
        },
        isLoading: false,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  /**
   * Fetch single product by ID
   * Sets currentProduct state
   */
  fetchProductById: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const product = await api.getProductById(id);
      set({
        currentProduct: product,
        isLoading: false,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch product';
      set({
        error: errorMessage,
        isLoading: false,
        currentProduct: null,
      });
    }
  },

  /**
   * Manually set current product
   * Useful when navigating from list view or updating UI
   */
  setCurrentProduct: (product: ProductPublic | null) => {
    set({ currentProduct: product });
  },

  /**
   * Set loading state
   */
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  /**
   * Set error message
   * Can be cleared by passing null
   */
  setError: (error: string | null) => {
    set({ error });
  },

  /**
   * Update pagination state
   */
  setPagination: (pagination: PaginationResponse & { page: number; limit: number }) => {
    set({ pagination });
  },

  /**
   * Clear products and reset to initial state
   */
  clearProducts: () => {
    set({
      products: [],
      currentProduct: null,
      isLoading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    });
  },
}));

/**
 * Hook to use products store
 * @returns useProductsStore instance with state and actions
 */
export const useProducts = () => useProductsStore();

export default useProductsStore;
