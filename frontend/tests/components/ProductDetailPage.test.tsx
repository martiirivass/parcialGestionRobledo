/**
 * ProductDetailPage Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ProductDetailPage } from '../../src/features/products/components/ProductDetailPage';
import { useProductsStore } from '../../src/features/products/store/productsStore';
import * as Router from 'react-router-dom';

// Mock react-router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: vi.fn(),
  };
});

// Mock the products store
vi.mock('../../src/features/products/store/productsStore', () => ({
  useProductsStore: vi.fn(),
}));

const mockProduct = {
  id: '1',
  nombre: 'Leche Entera',
  precio: 250.5,
  disponible: true,
  imagen_url: 'https://example.com/leche.jpg',
  categorias: [{ id: '1', nombre: 'Lácteos', descripcion: '' }],
  ingredientes: [
    { id: '1', nombre: 'Leche', es_alergeno: false, descripcion: 'Leche pura' },
    {
      id: '2',
      nombre: 'Cacahuete',
      es_alergeno: true,
      descripcion: 'Trazas de cacahuete',
    },
  ],
  descripcion: 'Leche entera fresca de las mejores vacas',
};

describe('ProductDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (Router.useParams as any).mockReturnValue({ id: '1' });
    (Router.useNavigate as any).mockReturnValue(vi.fn());
  });

  it('should fetch and display product details', async () => {
    const fetchProductById = vi.fn();
    (useProductsStore as any).mockReturnValue({
      productDetail: mockProduct,
      loading: false,
      error: null,
      fetchProductById,
    });

    render(
      <BrowserRouter>
        <ProductDetailPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(mockProduct.nombre)).toBeInTheDocument();
      expect(screen.getByText(`$${mockProduct.precio}`)).toBeInTheDocument();
      expect(
        screen.getByText(mockProduct.descripcion)
      ).toBeInTheDocument();
    });
  });

  it('should show loading spinner while fetching', () => {
    (useProductsStore as any).mockReturnValue({
      productDetail: null,
      loading: true,
      error: null,
      fetchProductById: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProductDetailPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should show error message when fetch fails', () => {
    const error = 'Product not found';
    (useProductsStore as any).mockReturnValue({
      productDetail: null,
      loading: false,
      error,
      fetchProductById: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProductDetailPage />
      </BrowserRouter>
    );

    expect(screen.getByText(error)).toBeInTheDocument();
  });

  it('should render product image', () => {
    (useProductsStore as any).mockReturnValue({
      productDetail: mockProduct,
      loading: false,
      error: null,
      fetchProductById: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProductDetailPage />
      </BrowserRouter>
    );

    const image = screen.getByAltText(mockProduct.nombre) as HTMLImageElement;
    expect(image).toBeInTheDocument();
    expect(image.src).toBe(mockProduct.imagen_url);
  });

  it('should render categories', () => {
    (useProductsStore as any).mockReturnValue({
      productDetail: mockProduct,
      loading: false,
      error: null,
      fetchProductById: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProductDetailPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Lácteos')).toBeInTheDocument();
  });

  it('should separate allergens from regular ingredients', () => {
    (useProductsStore as any).mockReturnValue({
      productDetail: mockProduct,
      loading: false,
      error: null,
      fetchProductById: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProductDetailPage />
      </BrowserRouter>
    );

    // Allergen should be highlighted in red
    const allergenBadge = screen.getByText('Cacahuete');
    expect(allergenBadge).toHaveClass('bg-red-100', 'text-red-800');

    // Regular ingredient should be normal
    const ingredientBadge = screen.getByText('Leche');
    expect(ingredientBadge).not.toHaveClass('bg-red-100');
  });

  it('should render ingredient exclusion checkboxes', () => {
    (useProductsStore as any).mockReturnValue({
      productDetail: mockProduct,
      loading: false,
      error: null,
      fetchProductById: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProductDetailPage />
      </BrowserRouter>
    );

    expect(
      screen.getByRole('checkbox', { name: /exclude leche/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /exclude cacahuete/i })
    ).toBeInTheDocument();
  });

  it('should render availability badge', () => {
    (useProductsStore as any).mockReturnValue({
      productDetail: mockProduct,
      loading: false,
      error: null,
      fetchProductById: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProductDetailPage />
      </BrowserRouter>
    );

    const badge = screen.getByText('Disponible');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-100');
  });

  it('should render add to cart button', () => {
    (useProductsStore as any).mockReturnValue({
      productDetail: mockProduct,
      loading: false,
      error: null,
      fetchProductById: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProductDetailPage />
      </BrowserRouter>
    );

    expect(
      screen.getByRole('button', { name: /add to cart/i })
    ).toBeInTheDocument();
  });

  it('should render back button', () => {
    (useProductsStore as any).mockReturnValue({
      productDetail: mockProduct,
      loading: false,
      error: null,
      fetchProductById: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProductDetailPage />
      </BrowserRouter>
    );

    expect(
      screen.getByRole('button', { name: /back to products/i })
    ).toBeInTheDocument();
  });

  it('should navigate back when back button is clicked', async () => {
    const user = userEvent.setup();
    const mockNavigate = vi.fn();
    (Router.useNavigate as any).mockReturnValue(mockNavigate);

    (useProductsStore as any).mockReturnValue({
      productDetail: mockProduct,
      loading: false,
      error: null,
      fetchProductById: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProductDetailPage />
      </BrowserRouter>
    );

    const backButton = screen.getByRole('button', { name: /back to products/i });
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('should handle ingredient checkbox changes', async () => {
    const user = userEvent.setup();
    (useProductsStore as any).mockReturnValue({
      productDetail: mockProduct,
      loading: false,
      error: null,
      fetchProductById: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProductDetailPage />
      </BrowserRouter>
    );

    const checkbox = screen.getByRole('checkbox', {
      name: /exclude leche/i,
    });
    await user.click(checkbox);

    expect(checkbox).toBeChecked();
  });

  it('should fetch product by id on mount', () => {
    const fetchProductById = vi.fn();
    (useProductsStore as any).mockReturnValue({
      productDetail: mockProduct,
      loading: false,
      error: null,
      fetchProductById,
    });

    render(
      <BrowserRouter>
        <ProductDetailPage />
      </BrowserRouter>
    );

    expect(fetchProductById).toHaveBeenCalledWith('1');
  });

  it('should show unavailable badge when product is not available', () => {
    const unavailableProduct = { ...mockProduct, disponible: false };
    (useProductsStore as any).mockReturnValue({
      productDetail: unavailableProduct,
      loading: false,
      error: null,
      fetchProductById: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProductDetailPage />
      </BrowserRouter>
    );

    const badge = screen.getByText('No disponible');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-100');
  });
});
