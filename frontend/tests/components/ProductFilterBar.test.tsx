/**
 * ProductFilterBar Component Tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductFilterBar } from "../../src/features/products/components/ProductFilterBar";

describe("ProductFilterBar", () => {
  const mockCategories = [
    { id: "1", nombre: "Lácteos", descripcion: "Productos lácteos" },
    { id: "2", nombre: "Bebidas", descripcion: "Bebidas diversas" },
  ];

  const mockAllergens = [
    { id: "1", nombre: "Cacahuete", es_alergeno: true, descripcion: "" },
    { id: "2", nombre: "Leche", es_alergeno: true, descripcion: "" },
    { id: "3", nombre: "Gluten", es_alergeno: true, descripcion: "" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render search input", () => {
    const onFilter = vi.fn();
    render(
      <ProductFilterBar onFilter={onFilter} categorias={mockCategories} />,
    );

    expect(screen.getByPlaceholderText(/search products/i)).toBeInTheDocument();
  });

  it("should render category dropdown", () => {
    const onFilter = vi.fn();
    render(
      <ProductFilterBar onFilter={onFilter} categorias={mockCategories} />,
    );

    const categorySelect = screen.getByDisplayValue(/all categories/i);
    expect(categorySelect).toBeInTheDocument();
  });

  it("should render clear filters button", () => {
    const onFilter = vi.fn();
    render(
      <ProductFilterBar onFilter={onFilter} categorias={mockCategories} />,
    );

    expect(
      screen.getByRole("button", { name: /clear filters/i }),
    ).toBeInTheDocument();
  });

  it("should call onFilter when search input changes", async () => {
    const user = userEvent.setup();
    const onFilter = vi.fn();

    render(
      <ProductFilterBar onFilter={onFilter} categorias={mockCategories} />,
    );

    const searchInput = screen.getByPlaceholderText(/search products/i);
    await user.type(searchInput, "leche");

    // Debounce waits 300ms
    await waitFor(
      () => {
        expect(onFilter).toHaveBeenCalled();
      },
      { timeout: 1000 },
    );
  });

  it("should call onFilter when category changes", async () => {
    const user = userEvent.setup();
    const onFilter = vi.fn();

    render(
      <ProductFilterBar onFilter={onFilter} categorias={mockCategories} />,
    );

    const categorySelect = screen.getByDisplayValue(/all categories/i);
    await user.selectOptions(categorySelect, "1");

    expect(onFilter).toHaveBeenCalledWith(
      expect.objectContaining({
        category_id: "1",
      }),
    );
  });

  it("should clear all filters when clear button is clicked", async () => {
    const user = userEvent.setup();
    const onFilter = vi.fn();

    render(
      <ProductFilterBar onFilter={onFilter} categorias={mockCategories} />,
    );

    // Fill search
    const searchInput = screen.getByPlaceholderText(/search products/i);
    await user.type(searchInput, "test");

    // Wait for debounce and first filter call
    await waitFor(() => {
      expect(onFilter).toHaveBeenCalled();
    });

    onFilter.mockClear();

    // Click clear button
    const clearButton = screen.getByRole("button", { name: /clear filters/i });
    await user.click(clearButton);

    expect(onFilter).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "",
        category_id: undefined,
        exclude_allergens: [],
      }),
    );
  });

  it("should handle allergen multi-select", async () => {
    const user = userEvent.setup();
    const onFilter = vi.fn();

    render(
      <ProductFilterBar
        onFilter={onFilter}
        categorias={mockCategories}
        allergens={mockAllergens}
      />,
    );

    // Find allergen checkboxes
    const cacahueteCheckbox = screen.getByRole("checkbox", {
      name: /cacahuete/i,
    });
    const lechCheckbox = screen.getByRole("checkbox", { name: /leche/i });

    // Select multiple allergens
    await user.click(cacahueteCheckbox);
    await user.click(lechCheckbox);

    await waitFor(() => {
      expect(onFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          exclude_allergens: expect.arrayContaining(["1", "2"]),
        }),
      );
    });
  });

  it("should be responsive - stack on mobile", () => {
    const onFilter = vi.fn();
    const { container } = render(
      <ProductFilterBar onFilter={onFilter} categorias={mockCategories} />,
    );

    const filterBar = container.querySelector('[class*="flex-col"]');
    expect(filterBar).toHaveClass("md:flex-row");
  });

  it("should respect debounce on search input", async () => {
    const user = userEvent.setup({ delay: 50 }); // Fast typing
    const onFilter = vi.fn();

    render(
      <ProductFilterBar onFilter={onFilter} categorias={mockCategories} />,
    );

    const searchInput = screen.getByPlaceholderText(/search products/i);

    // Type 3 characters quickly
    await user.type(searchInput, "abc");

    // onFilter should NOT be called yet due to debounce
    expect(onFilter).not.toHaveBeenCalled();

    // Wait for debounce (300ms+)
    await waitFor(
      () => {
        expect(onFilter).toHaveBeenCalledTimes(1);
      },
      { timeout: 500 },
    );
  });
});
