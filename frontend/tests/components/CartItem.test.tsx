/**
 * CartItem component tests
 * Tests rendering and user interactions
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CartItem } from "../../src/features/cart/components/CartItem";
import type { CartItem as CartItemType } from "../../src/features/cart/types";

const mockItem: CartItemType = {
  productoId: 1,
  producto: {
    id: 1,
    nombre: "Pizza Margherita",
    descripcion: "Classic Italian pizza",
    imagen: "https://example.com/pizza.jpg",
    precio: 250.5,
    stock_cantidad: 10,
    disponible: true,
  },
  cantidad: 2,
  personalizacion: [1, 2],
};

describe("CartItem Component", () => {
  const mockOnUpdateQuantity = vi.fn();
  const mockOnRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render product name", () => {
    render(
      <CartItem
        item={mockItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />,
    );

    expect(screen.getByText("Pizza Margherita")).toBeInTheDocument();
  });

  it("should render product price", () => {
    render(
      <CartItem
        item={mockItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />,
    );

    expect(screen.getByText("$250.50")).toBeInTheDocument();
  });

  it("should render quantity", () => {
    render(
      <CartItem
        item={mockItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />,
    );

    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("should render subtotal", () => {
    render(
      <CartItem
        item={mockItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />,
    );

    // 2 * 250.50 = 501
    expect(screen.getByText("$501.00")).toBeInTheDocument();
  });

  it("should render personalization info when present", () => {
    render(
      <CartItem
        item={mockItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />,
    );

    expect(screen.getByText(/Sin:/)).toBeInTheDocument();
  });

  it("should call onRemove when remove button is clicked", () => {
    render(
      <CartItem
        item={mockItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />,
    );

    const removeButton = screen.getByLabelText("Remove item");
    fireEvent.click(removeButton);

    expect(mockOnRemove).toHaveBeenCalledWith(1);
  });

  it("should call onUpdateQuantity when minus button is clicked", () => {
    render(
      <CartItem
        item={mockItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />,
    );

    const minusButton = screen.getByLabelText("Decrease quantity");
    fireEvent.click(minusButton);

    expect(mockOnUpdateQuantity).toHaveBeenCalledWith(1, 1); // 2 - 1 = 1
  });

  it("should call onUpdateQuantity when plus button is clicked", () => {
    render(
      <CartItem
        item={mockItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />,
    );

    const plusButton = screen.getByLabelText("Increase quantity");
    fireEvent.click(plusButton);

    expect(mockOnUpdateQuantity).toHaveBeenCalledWith(1, 3); // 2 + 1 = 3
  });

  it("should disable minus button when quantity is 1", () => {
    const itemWithQty1 = { ...mockItem, cantidad: 1 };

    render(
      <CartItem
        item={itemWithQty1}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />,
    );

    const minusButton = screen.getByLabelText("Decrease quantity");
    expect(minusButton).toBeDisabled();
  });

  it("should disable plus button when stock is exceeded", () => {
    const itemWithMaxStock = { ...mockItem, cantidad: 10 };

    render(
      <CartItem
        item={itemWithMaxStock}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />,
    );

    const plusButton = screen.getByLabelText("Increase quantity");
    expect(plusButton).toBeDisabled();
  });

  it("should render placeholder when no image", () => {
    const itemWithoutImage = {
      ...mockItem,
      producto: { ...mockItem.producto, imagen: undefined },
    };

    render(
      <CartItem
        item={itemWithoutImage}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />,
    );

    // Should render without image
    expect(screen.getByText("Pizza Margherita")).toBeInTheDocument();
  });
});