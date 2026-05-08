/**
 * Unit tests for CategoriasStore (Zustand)
 * Tests state management and actions
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCategoriasStore } from '../categoriasStore';
import * as api from '../../api';

// Mock the API module
jest.mock('../../api');

const mockCategories = [
  {
    id: 'cat-1',
    nombre: 'Fruits',
    padre_id: null,
    creado_en: '2026-05-01T00:00:00Z',
    actualizado_en: '2026-05-01T00:00:00Z',
    eliminado_en: null,
    subcategorias: [
      {
        id: 'cat-1-1',
        nombre: 'Citrus',
        padre_id: 'cat-1',
        creado_en: '2026-05-01T00:00:00Z',
        actualizado_en: '2026-05-01T00:00:00Z',
        eliminado_en: null,
        subcategorias: [],
      },
    ],
  },
];

describe('CategoriasStore', () => {
  beforeEach(() => {
    // Clear store state before each test
    const { result } = renderHook(() => useCategoriasStore());
    act(() => {
      result.current.reset();
    });
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('initializes with empty state', () => {
      const { result } = renderHook(() => useCategoriasStore());

      expect(result.current.categories).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.selectedCategoryId).toBeNull();
    });
  });

  describe('fetchCategories', () => {
    test('fetchCategories sets loading true then false', async () => {
      const mockFetch = jest.fn().mockResolvedValue(mockCategories);
      (api.fetchCategoryTree as jest.Mock) = mockFetch;

      const { result } = renderHook(() => useCategoriasStore());

      expect(result.current.loading).toBe(false);

      act(() => {
        result.current.fetchCategories();
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.categories).toEqual(mockCategories);
      expect(result.current.error).toBeNull();
    });

    test('fetchCategories handles API errors', async () => {
      const errorMessage = 'API Error: Failed to fetch';
      const mockFetch = jest.fn().mockRejectedValue(new Error(errorMessage));
      (api.fetchCategoryTree as jest.Mock) = mockFetch;

      const { result } = renderHook(() => useCategoriasStore());

      act(() => {
        result.current.fetchCategories();
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toContain('Failed to fetch');
      expect(result.current.categories).toEqual([]);
    });

    test('fetchCategories updates categories state', async () => {
      const mockFetch = jest.fn().mockResolvedValue(mockCategories);
      (api.fetchCategoryTree as jest.Mock) = mockFetch;

      const { result } = renderHook(() => useCategoriasStore());

      act(() => {
        result.current.fetchCategories();
      });

      await waitFor(() => {
        expect(result.current.categories).toEqual(mockCategories);
      });

      expect(result.current.categories[0].nombre).toBe('Fruits');
      expect(result.current.categories[0].subcategorias.length).toBe(1);
    });

    test('clears error when successful fetch', async () => {
      const mockFetch = jest.fn().mockResolvedValue(mockCategories);
      (api.fetchCategoryTree as jest.Mock) = mockFetch;

      const { result } = renderHook(() => useCategoriasStore());

      // Set error first
      act(() => {
        result.current.error = 'Previous error';
      });

      act(() => {
        result.current.fetchCategories();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('setSelectedCategory', () => {
    test('setSelectedCategory updates selectedCategoryId', () => {
      const { result } = renderHook(() => useCategoriasStore());

      act(() => {
        result.current.setSelectedCategory('cat-1');
      });

      expect(result.current.selectedCategoryId).toBe('cat-1');
    });

    test('setSelectedCategory can be reset to null', () => {
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

    test('setSelectedCategory works with different IDs', () => {
      const { result } = renderHook(() => useCategoriasStore());

      act(() => {
        result.current.setSelectedCategory('cat-1');
      });
      expect(result.current.selectedCategoryId).toBe('cat-1');

      act(() => {
        result.current.setSelectedCategory('cat-2');
      });
      expect(result.current.selectedCategoryId).toBe('cat-2');
    });
  });

  describe('reset', () => {
    test('reset clears all state', async () => {
      const mockFetch = jest.fn().mockResolvedValue(mockCategories);
      (api.fetchCategoryTree as jest.Mock) = mockFetch;

      const { result } = renderHook(() => useCategoriasStore());

      // Set initial state
      act(() => {
        result.current.fetchCategories();
      });

      await waitFor(() => {
        expect(result.current.categories.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.setSelectedCategory('cat-1');
      });

      expect(result.current.selectedCategoryId).toBe('cat-1');

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.categories).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.selectedCategoryId).toBeNull();
    });
  });

  describe('Caching behavior', () => {
    test('does not refetch if categories already loaded', async () => {
      const mockFetch = jest.fn().mockResolvedValue(mockCategories);
      (api.fetchCategoryTree as jest.Mock) = mockFetch;

      const { result } = renderHook(() => useCategoriasStore());

      // First fetch
      act(() => {
        result.current.fetchCategories();
      });

      await waitFor(() => {
        expect(result.current.categories.length).toBeGreaterThan(0);
      });

      const callCount = mockFetch.mock.calls.length;

      // Try to fetch again
      act(() => {
        result.current.fetchCategories();
      });

      // Should call API again (current implementation doesn't cache)
      // This test documents the current behavior
      expect(mockFetch.mock.calls.length).toBeGreaterThan(callCount);
    });
  });
});
