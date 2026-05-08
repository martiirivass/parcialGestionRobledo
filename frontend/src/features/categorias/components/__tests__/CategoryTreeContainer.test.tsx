/**
 * CategoryTreeContainer Component Tests
 * Tests for data fetching and integration with store
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { CategoryTreeContainer } from '../CategoryTreeContainer';
import * as store from '../../store/categoriasStore';
import { CategoryTreeNode } from '../../types';

// Mock the store
jest.mock('../../store/categoriasStore');

const mockCategories: CategoryTreeNode[] = [
  {
    id: 'cat-1',
    nombre: 'Fruits',
    padre_id: null,
    creado_en: '2024-01-01T00:00:00Z',
    actualizado_en: '2024-01-01T00:00:00Z',
    eliminado_en: null,
    subcategorias: [],
  },
];

describe('CategoryTreeContainer', () => {
  const mockFetchCategories = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchCategories.mockResolvedValue(undefined);
  });

  describe('Loading State', () => {
    it('should display loading spinner when loading is true', () => {
      (store.useCategoriasStore as jest.Mock).mockReturnValue({
        categories: [],
        loading: true,
        error: null,
        selectedCategoryId: null,
        fetchCategories: mockFetchCategories,
      });

      render(<CategoryTreeContainer />);

      expect(screen.getByText('Loading categories...')).toBeInTheDocument();
    });

    it('should show spinning animation during load', () => {
      (store.useCategoriasStore as jest.Mock).mockReturnValue({
        categories: [],
        loading: true,
        error: null,
        selectedCategoryId: null,
        fetchCategories: mockFetchCategories,
      });

      const { container } = render(<CategoryTreeContainer />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when error exists', () => {
      const errorMsg = 'Failed to load categories';
      (store.useCategoriasStore as jest.Mock).mockReturnValue({
        categories: [],
        loading: false,
        error: errorMsg,
        selectedCategoryId: null,
        fetchCategories: mockFetchCategories,
      });

      render(<CategoryTreeContainer />);

      expect(screen.getByText('Error loading categories')).toBeInTheDocument();
      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });

    it('should have red styling for error state', () => {
      (store.useCategoriasStore as jest.Mock).mockReturnValue({
        categories: [],
        loading: false,
        error: 'Test error',
        selectedCategoryId: null,
        fetchCategories: mockFetchCategories,
      });

      const { container } = render(<CategoryTreeContainer />);

      const errorDiv = container.querySelector('.bg-red-50');
      expect(errorDiv).toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    it('should render CategoryTree when data is loaded', () => {
      (store.useCategoriasStore as jest.Mock).mockReturnValue({
        categories: mockCategories,
        loading: false,
        error: null,
        selectedCategoryId: null,
        fetchCategories: mockFetchCategories,
      });

      render(<CategoryTreeContainer />);

      expect(screen.getByText('Fruits')).toBeInTheDocument();
    });

    it('should pass categories to CategoryTree component', () => {
      (store.useCategoriasStore as jest.Mock).mockReturnValue({
        categories: mockCategories,
        loading: false,
        error: null,
        selectedCategoryId: null,
        fetchCategories: mockFetchCategories,
      });

      render(<CategoryTreeContainer />);

      expect(screen.getByText('Fruits')).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('should call fetchCategories on mount', async () => {
      (store.useCategoriasStore as jest.Mock).mockReturnValue({
        categories: mockCategories,
        loading: false,
        error: null,
        selectedCategoryId: null,
        fetchCategories: mockFetchCategories,
      });

      render(<CategoryTreeContainer />);

      await waitFor(() => {
        expect(mockFetchCategories).toHaveBeenCalled();
      });
    });

    it('should handle fetch errors without crashing', async () => {
      mockFetchCategories.mockRejectedValue(new Error('Fetch failed'));

      (store.useCategoriasStore as jest.Mock).mockReturnValue({
        categories: [],
        loading: false,
        error: 'Failed to fetch categories: Fetch failed',
        selectedCategoryId: null,
        fetchCategories: mockFetchCategories,
      });

      const { container } = render(<CategoryTreeContainer />);

      // Should render without crashing
      expect(container).toBeInTheDocument();
    });
  });

  describe('Props Forwarding', () => {
    it('should forward onSelectCategory prop to CategoryTree', () => {
      const handleSelect = jest.fn();

      (store.useCategoriasStore as jest.Mock).mockReturnValue({
        categories: mockCategories,
        loading: false,
        error: null,
        selectedCategoryId: null,
        fetchCategories: mockFetchCategories,
      });

      const { container } = render(
        <CategoryTreeContainer onSelectCategory={handleSelect} />
      );

      const categoryItem = screen.getByText('Fruits');
      categoryItem.click();

      expect(handleSelect).toHaveBeenCalled();
    });

    it('should forward selectedCategoryId prop to CategoryTree', () => {
      (store.useCategoriasStore as jest.Mock).mockReturnValue({
        categories: mockCategories,
        loading: false,
        error: null,
        selectedCategoryId: null,
        fetchCategories: mockFetchCategories,
      });

      render(
        <CategoryTreeContainer selectedCategoryId="cat-1" />
      );

      const categoryItem = screen.getByText('Fruits');
      expect(categoryItem).toHaveClass('bg-blue-50');
    });

    it('should forward expandable prop to CategoryTree', () => {
      (store.useCategoriasStore as jest.Mock).mockReturnValue({
        categories: mockCategories,
        loading: false,
        error: null,
        selectedCategoryId: null,
        fetchCategories: mockFetchCategories,
      });

      const { container } = render(
        <CategoryTreeContainer expandable={false} />
      );

      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(0); // No expand buttons
    });
  });
});
