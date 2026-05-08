/**
 * Zustand Categories Store Tests
 * Unit tests for category state management
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCategoriasStore } from '../categoriasStore';
import * as categoriaAPI from '../../api';
import { CategoryTreeNode } from '../../types';

// Mock the API module
jest.mock('../../api');

// Mock category data
const mockCategoryTree: CategoryTreeNode[] = [
  {
    id: 'cat-1',
    nombre: 'Fruits',
    padre_id: null,
    creado_en: '2024-01-01T00:00:00Z',
    actualizado_en: '2024-01-01T00:00:00Z',
    eliminado_en: null,
    subcategorias: [
      {
        id: 'cat-2',
        nombre: 'Citrus',
        padre_id: 'cat-1',
        creado_en: '2024-01-01T00:00:00Z',
        actualizado_en: '2024-01-01T00:00:00Z',
        eliminado_en: null,
        subcategorias: [],
      },
    ],
  },
];

describe('CategoriasStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useCategoriasStore.setState({
      categories: [],
      loading: false,
      error: null,
      selectedCategoryId: null,
      lastFetchTime: null,
    });
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with empty categories and loading false', () => {
      const { result } = renderHook(() => useCategoriasStore());
      expect(result.current.categories).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.selectedCategoryId).toBeNull();
    });
  });

  describe('fetchCategories', () => {
    it('should fetch categories and update state on success', async () => {
      (categoriaAPI.fetchCategoryTree as jest.Mock).mockResolvedValue(
        mockCategoryTree
      );

      const { result } = renderHook(() => useCategoriasStore());

      await act(async () => {
        await result.current.fetchCategories();
      });

      expect(result.current.categories).toEqual(mockCategoryTree);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set loading to true while fetching', async () => {
      (categoriaAPI.fetchCategoryTree as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockCategoryTree), 100);
          })
      );

      const { result } = renderHook(() => useCategoriasStore());

      const fetchPromise = act(async () => {
        const promise = result.current.fetchCategories();
        await waitFor(() => {
          expect(result.current.loading).toBe(true);
        });
        await promise;
      });

      await fetchPromise;
      expect(result.current.loading).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
      const errorMessage = 'Network error';
      (categoriaAPI.fetchCategoryTree as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useCategoriasStore());

      await act(async () => {
        try {
          await result.current.fetchCategories();
        } catch (e) {
          // Error is expected
        }
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toContain('Network error');
      expect(result.current.categories).toEqual([]);
    });

    it('should implement caching - no refetch within CACHE_DURATION', async () => {
      (categoriaAPI.fetchCategoryTree as jest.Mock).mockResolvedValue(
        mockCategoryTree
      );

      const { result } = renderHook(() => useCategoriasStore());

      // First fetch
      await act(async () => {
        await result.current.fetchCategories();
      });

      expect(categoriaAPI.fetchCategoryTree).toHaveBeenCalledTimes(1);

      // Second fetch should use cache
      await act(async () => {
        await result.current.fetchCategories();
      });

      expect(categoriaAPI.fetchCategoryTree).toHaveBeenCalledTimes(1);
    });

    it('should bypass cache when forceRefresh is true', async () => {
      (categoriaAPI.fetchCategoryTree as jest.Mock).mockResolvedValue(
        mockCategoryTree
      );

      const { result } = renderHook(() => useCategoriasStore());

      // First fetch
      await act(async () => {
        await result.current.fetchCategories();
      });

      expect(categoriaAPI.fetchCategoryTree).toHaveBeenCalledTimes(1);

      // Force refresh
      await act(async () => {
        await result.current.fetchCategories(true);
      });

      expect(categoriaAPI.fetchCategoryTree).toHaveBeenCalledTimes(2);
    });

    it('should clear previous categories on fetch error', async () => {
      (categoriaAPI.fetchCategoryTree as jest.Mock).mockResolvedValue(
        mockCategoryTree
      );

      const { result } = renderHook(() => useCategoriasStore());

      // First successful fetch
      await act(async () => {
        await result.current.fetchCategories();
      });

      expect(result.current.categories).toEqual(mockCategoryTree);

      // Second fetch with error
      (categoriaAPI.fetchCategoryTree as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      await act(async () => {
        try {
          await result.current.fetchCategories(true);
        } catch (e) {
          // Error is expected
        }
      });

      expect(result.current.categories).toEqual([]);
      expect(result.current.error).toContain('API Error');
    });
  });

  describe('setSelectedCategory', () => {
    it('should update selectedCategoryId', () => {
      const { result } = renderHook(() => useCategoriasStore());

      act(() => {
        result.current.setSelectedCategory('cat-1');
      });

      expect(result.current.selectedCategoryId).toBe('cat-1');
    });

    it('should allow resetting to null', () => {
      const { result } = renderHook(() => useCategoriasStore());

      act(() => {
        result.current.setSelectedCategory('cat-1');
      });

      expect(result.current.selectedCategoryId).toBe('cat-1');

      act(() => {
        result.current.setSelectedCategory(null);
      });

      expect(result.current.selectedCategoryId).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', async () => {
      (categoriaAPI.fetchCategoryTree as jest.Mock).mockResolvedValue(
        mockCategoryTree
      );

      const { result } = renderHook(() => useCategoriasStore());

      // Set up some state
      await act(async () => {
        await result.current.fetchCategories();
      });

      act(() => {
        result.current.setSelectedCategory('cat-1');
      });

      expect(result.current.categories.length).toBeGreaterThan(0);
      expect(result.current.selectedCategoryId).toBe('cat-1');

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.categories).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.selectedCategoryId).toBeNull();
      expect(result.current.lastFetchTime).toBeNull();
    });
  });

  describe('State consistency', () => {
    it('should clear error when successful fetch completes', async () => {
      // First failed fetch
      (categoriaAPI.fetchCategoryTree as jest.Mock).mockRejectedValueOnce(
        new Error('Initial error')
      );

      const { result } = renderHook(() => useCategoriasStore());

      await act(async () => {
        try {
          await result.current.fetchCategories();
        } catch (e) {
          // Error expected
        }
      });

      expect(result.current.error).toBeTruthy();

      // Second successful fetch
      (categoriaAPI.fetchCategoryTree as jest.Mock).mockResolvedValueOnce(
        mockCategoryTree
      );

      await act(async () => {
        await result.current.fetchCategories(true);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.categories).toEqual(mockCategoryTree);
    });
  });
});
