/**
 * ProductCard Component Tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductCard } from "../../src/features/products/components/ProductCard";
import { ProductPublic } from "../../src/features/products/types";

describe("ProductCard", () => {
  const mockProduct: ProductPublic = {
    id: "1",
    nombre: "Leche Entera",
    precio: 250.5,
    disponible: true,
    imagen_url: "https://example.com/leche.jpg",
    categorias: [
      { id: "1", nombre: "Lácteos", descripcion: "Productos lácteos" },
    ],
    ingredientes: [
      {
        id: "1",
        nombre: "Leche",
        es_alergeno: false,
        descripcion: "Leche pura",
      },
    ],
    descripcion: "Leche entera fresca",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render product name and price", () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText("Leche Entera")).toBeInTheDocument();
    expect(screen.getByText("$250.50")).toBeInTheDocument();
  });

  it("should render product image with correct alt text", () => {
    render(<ProductCard product={mockProduct} />);

    const image = screen.getByAltText("Leche Entera") as HTMLImageElement;
    expect(image).toBeInTheDocument();
    expect(image.src).toBe("https://example.com/leche.jpg");
  });

  it("should render availability badge as green when available", () => {
    render(<ProductCard product={mockProduct} />);

    const badge = screen.getByText("Disponible");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-green-100", "text-green-800");
  });

  it("should render availability badge as gray when not available", () => {
    const unavailableProduct = { ...mockProduct, disponible: false };
    render(<ProductCard product={unavailableProduct} />);

    const badge = screen.getByText("No disponible");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-gray-100", "text-gray-800");
  });

  it("should render categories as pills (max 2 + counter)", () => {
    const productWithCategories = {
      ...mockProduct,
      categorias: [
        { id: "1", nombre: "Lácteos", descripcion: "" },
        { id: "2", nombre: "Bebidas", descripcion: "" },
        { id: "3", nombre: "Refrigerados", descripcion: "" },
      ],
    };
    render(<ProductCard product={productWithCategories} />);

    expect(screen.getByText("Lácteos")).toBeInTheDocument();
    expect(screen.getByText("Bebidas")).toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument(); // 1 more category
  });

  it("should call onSelect callback when clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<ProductCard product={mockProduct} onSelect={onSelect} />);

    const card = screen.getByText("Leche Entera").closest("div");
    await user.click(card!);

    expect(onSelect).toHaveBeenCalledWith(mockProduct);
  });

  it("should use placeholder image when imagen_url is not provided", () => {
    const productWithoutImage = { ...mockProduct, imagen_url: null };
    render(<ProductCard product={productWithoutImage} />);

    const image = screen.getByAltText("Leche Entera") as HTMLImageElement;
    expect(image.src).toContain("placeholder");
  });

  it("should highlight allergens in red", () => {
    const productWithAllergen = {
      ...mockProduct,
      ingredientes: [
        { id: "1", nombre: "Cacahuete", es_alergeno: true, descripcion: "" },
        { id: "2", nombre: "Azúcar", es_alergeno: false, descripcion: "" },
      ],
    };
    render(<ProductCard product={productWithAllergen} />);

    const allergenBadge = screen.getByText("Cacahuete");
    expect(allergenBadge).toHaveClass("bg-red-100", "text-red-800");
  });

  it("should have hover effects applied", () => {
    const { container } = render(<ProductCard product={mockProduct} />);
    const card = container.querySelector('[class*="hover:shadow-xl"]');
    expect(card).toHaveClass("hover:shadow-xl", "hover:scale-105");
  });
});
