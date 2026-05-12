/**
 * ProductDetailPage Component Tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { ProductDetailPage } from "../../src/features/products/components/ProductDetailPage";
import { useProducts } from "../../src/features/products/store/productsStore";
import * as Router from "react-router-dom";

// Mock react-router
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: vi.fn(),
  };
});

// Mock the products store
vi.mock("../../src/features/products/store/productsStore", async () => {
  const actual = await vi.importActual("../../src/features/products/store/productsStore");
  return {
    ...actual,
    useProducts: vi.fn(),
  };
});

const mockProduct = {
  id: "1",
  nombre: "Leche Entera",
  precio: 250.5,
  disponible: true,
  imagen_url: "https://example.com/leche.jpg",
  categorias: [{ id: "1", nombre: "Lácteos", descripcion: "" }],
  ingredientes: [
    { id: "1", nombre: "Leche", es_alergeno: false, descripcion: "Leche pura" },
    {
      id: "2",
      nombre: "Cacahuete",
      es_alergeno: true,
      descripcion: "Trazas de cacahuete",
    },
  ],
  descripcion: "Leche entera fresca de las mejores vacas",
};

describe("ProductDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (Router.useParams as any).mockReturnValue({ id: "1" });
    (Router.useNavigate as any).mockReturnValue(vi.fn());
  });

  it("should fetch product by id on mount", () => {
    const fetchProductById = vi.fn();
    (useProducts as any).mockReturnValue({
      currentProduct: mockProduct,
      isLoading: false,
      error: null,
      fetchProductById,
    });

    render(
      <BrowserRouter>
        <ProductDetailPage />
      </BrowserRouter>,
    );

    expect(fetchProductById).toHaveBeenCalledWith("1");
  });

  it("should fetch and display product details", async () => {
    const fetchProductById = vi.fn();
    (useProducts as any).mockReturnValue({
      currentProduct: mockProduct,
      isLoading: false,
      error: null,
      fetchProductById,
    });

    render(
      <BrowserRouter>
        <ProductDetailPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(mockProduct.nombre)).toBeInTheDocument();
      expect(screen.getByText(mockProduct.descripcion)).toBeInTheDocument();
    });
  });

  it("should show loading spinner while fetching", () => {
    (useProducts as any).mockReturnValue({
      currentProduct: null,
      isLoading: true,
      error: null,
      fetchProductById: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProductDetailPage />
      </BrowserRouter>,
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("should show error message when fetch fails", () => {
    const error = "Product not found";
    (useProducts as any).mockReturnValue({
      currentProduct: null,
      isLoading: false,
      error,
      fetchProductById: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProductDetailPage />
      </BrowserRouter>,
    );

    // Use getAllByText because error message appears twice in error box
    const errorElements = screen.getAllByText(error);
    expect(errorElements.length).toBeGreaterThan(0);
  });

  it("should render product image", () => {
    (useProducts as any).mockReturnValue({
      currentProduct: mockProduct,
      isLoading: false,
      error: null,
      fetchProductById: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProductDetailPage />
      </BrowserRouter>,
    );

    const image = screen.getByAltText(mockProduct.nombre) as HTMLImageElement;
    expect(image).toBeInTheDocument();
    expect(image.src).toBe(mockProduct.imagen_url);
  });

  it("should render categories", () => {
    (useProducts as any).mockReturnValue({
      currentProduct: mockProduct,
      isLoading: false,
      error: null,
      fetchProductById: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProductDetailPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Lácteos")).toBeInTheDocument();
  });

  it("should render add to cart button", () => {
    (useProducts as any).mockReturnValue({
      currentProduct: mockProduct,
      isLoading: false,
      error: null,
      fetchProductById: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProductDetailPage />
      </BrowserRouter>,
    );

    expect(
      screen.getByRole("button", { name: /add to cart/i }),
    ).toBeInTheDocument();
  });

  it("should render back button", () => {
    (useProducts as any).mockReturnValue({
      currentProduct: mockProduct,
      isLoading: false,
      error: null,
      fetchProductById: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProductDetailPage />
      </BrowserRouter>,
    );

    expect(
      screen.getByRole("button", { name: /back to products/i }),
    ).toBeInTheDocument();
  });

  it("should navigate back to home when back button is clicked", async () => {
    const user = userEvent.setup();
    const mockNavigate = vi.fn();
    (Router.useNavigate as any).mockReturnValue(mockNavigate);

    (useProducts as any).mockReturnValue({
      currentProduct: mockProduct,
      isLoading: false,
      error: null,
      fetchProductById: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProductDetailPage />
      </BrowserRouter>,
    );

    const backButton = screen.getByRole("button", {
      name: /back to products/i,
    });
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalled();
  });
});
