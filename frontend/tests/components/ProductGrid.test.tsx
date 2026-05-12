/**
 * ProductGrid Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductGrid } from '../../src/features/products/components/ProductGrid';
import { useProductsStore } from '../../src/features/products/store/productsStore';

// Mock the store
vi.mock('../../src/features/products/store/productsStore', () => ({
  useProductsStore: vi.fn(),
}));

describe('ProductGrid', () => {
  const mockProducts = [
    {
      id: '1',
      nombre: 'Leche',
      precio: 250,
      disponible: true,
      imagen_url: 'https://example.com/leche.jpg',
      categorias: [],
      ingredientes: [],
      descripcion: 'Leche fresca',
    },
    {
      id: '2',
      nombre: 'Queso',
      precio: 500,
      disponible: true,
      imagen_url: 'https://example.com/queso.jpg',
      categorias: [],
      ingredientes: [],
      descripcion: 'Queso cheddar',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useProductsStore as any).mockReturnValue({
      products: mockProducts,
      loading: false,
      error: null,
      pagination: { page: 1, total_pages: 1, total_items: 2 },
      fetchProducts: vi.fn(),
    });
  });

  it('should render product cards for each product', () => {
    render(<ProductGrid />);

    expect(screen.getByText('Leche')).toBeInTheDocument();
    expect(screen.getByText('Queso')).toBeInTheDocument();
  });

  it('should show loading spinner while fetching', () => {
    (useProductsStore as any).mockReturnValue({
      products: [],
      loading: true,
      error: null,
      pagination: { page: 1, total_pages: 1, total_items: 0 },
      fetchProducts: vi.fn(),
    });

    render(<ProductGrid />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should show error message when fetch fails', () => {
    const error = 'Failed to load products';
    (useProductsStore as any).mockReturnValue({
      products: [],
      loading: false,
      error,
      pagination: { page: 1, total_pages: 1, total_items: 0 },
      fetchProducts: vi.fn(),
    });

    render(<ProductGrid />);

    expect(screen.getByText(error)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should show empty state when no products found', () => {
    (useProductsStore as any).mockReturnValue({
      products: [],
      loading: false,
      error: null,
      pagination: { page: 1, total_pages: 1, total_items: 0 },
      fetchProducts: vi.fn(),
    });

    render(<ProductGrid />);

    expect(
      screen.getByText(/no products found/i)
    ).toBeInTheDocument();
  });

  it('should render pagination controls', () => {
    (useProductsStore as any).mockReturnValue({
      products: mockProducts,
      loading: false,
      error: null,
      pagination: { page: 2, total_pages: 5, total_items: 50 },
      fetchProducts: vi.fn(),
    });

    render(<ProductGrid />);

    expect(screen.getByText(/page 2 of 5/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('should call fetchProducts with new page on pagination', async () => {
    const user = userEvent.setup();
    const fetchProducts = vi.fn();

    (useProductsStore as any).mockReturnValue({
      products: mockProducts,
      loading: false,
      error: null,
      pagination: { page: 1, total_pages: 3, total_items: 30 },
      fetchProducts,
    });

    render(<ProductGrid />);

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    expect(fetchProducts).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
  });

  it('should apply responsive grid layout', () => {
    const { container } = render(<ProductGrid />);
    const grid = container.querySelector('[class*="grid"]');

    expect(grid).toHaveClass('grid-cols-2', 'md:grid-cols-3', 'lg:grid-cols-4');
  });

  it('should call retry when error retry button is clicked', async () => {
    const user = userEvent.setup();
    const fetchProducts = vi.fn();

    const { rerender } = render(<ProductGrid />);

    // First render with error
    (useProductsStore as any).mockReturnValue({
      products: [],
      loading: false,
      error: 'Failed to load',
      pagination: { page: 1, total_pages: 1, total_items: 0 },
      fetchProducts,
    });

    rerender(<ProductGrid />);

    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);

    expect(fetchProducts).toHaveBeenCalled();
  });

  it('should fetch products on mount', async () => {
    const fetchProducts = vi.fn();

    (useProductsStore as any).mockReturnValue({
      products: mockProducts,
      loading: false,
      error: null,
      pagination: { page: 1, total_pages: 1, total_items: 2 },
      fetchProducts,
    });

    render(<ProductGrid />);

    await waitFor(() => {
      expect(fetchProducts).toHaveBeenCalled();
    });
  });
});
