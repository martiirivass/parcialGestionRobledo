/**
 * CategoryDetailPage Tests
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CategoryDetailPage } from '../CategoryDetailPage';
import * as store from '../../features/categorias/store/categoriasStore';
import { CategoryTreeNode } from '../../features/categorias/types';

// Mock the store
jest.mock('../../features/categorias/store/categoriasStore');

// Mock the CategoryTree component
jest.mock('../../features/categorias/components/CategoryTree', () => ({
  CategoryTree: ({ categories }: any) => (
    <div data-testid="category-tree">
      {categories.map((cat: any) => (
        <div key={cat.id}>{cat.nombre}</div>
      ))}
    </div>
  ),
}));

const mockCategories: CategoryTreeNode[] = [
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

const mockFetchCategories = jest.fn();

const renderWithRouter = (categoryId: string = 'cat-1') => {
  return render(
    <BrowserRouter>
      <Routes>
        <Route path="/categories/:categoryId" element={<CategoryDetailPage />} />
      </Routes>
    </BrowserRouter>,
    {
      initialEntries: [`/categories/${categoryId}`],
    }
  );
};

describe('CategoryDetailPage', () => {
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
        fetchCategories: mockFetchCategories,
      });

      renderWithRouter();

      expect(screen.getByText('Loading category...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when category not found', () => {
      (store.useCategoriasStore as jest.Mock).mockReturnValue({
        categories: [],
        loading: false,
        error: null,
        fetchCategories: mockFetchCategories,
      });

      renderWithRouter('non-existent-id');

      expect(screen.getByText('Category Not Found')).toBeInTheDocument();
    });

    it('should display API error message if available', () => {
      (store.useCategoriasStore as jest.Mock).mockReturnValue({
        categories: [],
        loading: false,
        error: 'API Error: Connection failed',
        fetchCategories: mockFetchCategories,
      });

      renderWithRouter();

      expect(screen.getByText('API Error: Connection failed')).toBeInTheDocument();
    });

    it('should have Go Back Home button on error', () => {
      (store.useCategoriasStore as jest.Mock).mockReturnValue({
        categories: [],
        loading: false,
        error: 'Error',
        fetchCategories: mockFetchCategories,
      });

      renderWithRouter();

      const homeButton = screen.getByText('Go Back Home');
      expect(homeButton).toHaveAttribute('href', '/');
    });
  });

  describe('Category Header', () => {
    beforeEach(() => {
      (store.useCategoriasStore as jest.Mock).mockReturnValue({
        categories: mockCategories,
        loading: false,
        error: null,
        fetchCategories: mockFetchCategories,
      });
    });

    it('should display category name in header', () => {
      renderWithRouter('cat-1');

      expect(screen.getByText('Fruits')).toBeInTheDocument();
    });

    it('should display category description', () => {
      renderWithRouter('cat-1');

      expect(
        screen.getByText('Explore products in this category and its subcategories.')
      ).toBeInTheDocument();
    });
  });

  describe('Breadcrumb Navigation', () => {
    beforeEach(() => {
      (store.useCategoriasStore as jest.Mock).mockReturnValue({
        categories: mockCategories,
        loading: false,
        error: null,
        fetchCategories: mockFetchCategories,
      });
    });

    it('should display breadcrumb with Home link', () => {
      renderWithRouter('cat-1');

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Home')).toHaveAttribute('href', '/');
    });

    it('should display current category in breadcrumb', () => {
      renderWithRouter('cat-1');

      expect(screen.getByText('Fruits')).toBeInTheDocument();
    });

    it('should have breadcrumb navigation role', () => {
      renderWithRouter('cat-1');

      const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
      expect(breadcrumb).toBeInTheDocument();
    });
  });

  describe('Subcategories Sidebar', () => {
    beforeEach(() => {
      (store.useCategoriasStore as jest.Mock).mockReturnValue({
        categories: mockCategories,
        loading: false,
        error: null,
        fetchCategories: mockFetchCategories,
      });
    });

    it('should display subcategories section when they exist', async () => {
      renderWithRouter('cat-1');

      await waitFor(() => {
        expect(screen.getByText('Subcategories')).toBeInTheDocument();
      });
    });

    it('should not display subcategories section when none exist', async () => {
      renderWithRouter('cat-2');

      await waitFor(() => {
        expect(screen.queryByText('Subcategories')).not.toBeInTheDocument();
      });
    });

    it('should render CategoryTree component', () => {
      renderWithRouter('cat-1');

      expect(screen.getByTestId('category-tree')).toBeInTheDocument();
    });
  });

  describe('Products Section', () => {
    beforeEach(() => {
      (store.useCategoriasStore as jest.Mock).mockReturnValue({
        categories: mockCategories,
        loading: false,
        error: null,
        fetchCategories: mockFetchCategories,
      });
    });

    it('should display Products heading', () => {
      renderWithRouter('cat-1');

      expect(screen.getByText('Products')).toBeInTheDocument();
    });

    it('should display sort dropdown', () => {
      renderWithRouter('cat-1');

      expect(screen.getByDisplayValue('Sort by Name (A-Z)')).toBeInTheDocument();
    });

    it('should have sort options', () => {
      renderWithRouter('cat-1');

      const sortSelect = screen.getByDisplayValue('Sort by Name (A-Z)');
      expect(sortSelect).toHaveProperty('options.length', 4);
    });

    it('should display placeholder for products', () => {
      renderWithRouter('cat-1');

      expect(
        screen.getByText('Products will be displayed here in Phase 3')
      ).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('should call fetchCategories if categories not loaded', () => {
      (store.useCategoriasStore as jest.Mock).mockReturnValue({
        categories: [],
        loading: false,
        error: null,
        fetchCategories: mockFetchCategories,
      });

      renderWithRouter();

      expect(mockFetchCategories).toHaveBeenCalled();
    });

    it('should not call fetchCategories if categories already loaded', () => {
      (store.useCategoriasStore as jest.Mock).mockReturnValue({
        categories: mockCategories,
        loading: false,
        error: null,
        fetchCategories: mockFetchCategories,
      });

      renderWithRouter();

      expect(mockFetchCategories).not.toHaveBeenCalled();
    });
  });
});
