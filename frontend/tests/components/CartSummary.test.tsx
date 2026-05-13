/**
 * CartSummary component tests
 * Tests summary rendering and checkout button
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CartSummary } from "../../src/features/cart/components/CartSummary";
import { BrowserRouter } from "react-router-dom";

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("CartSummary Component", () => {
  const mockOnCheckout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render item count", () => {
    renderWithRouter(
      <CartSummary
        subtotal={100}
        itemCount={3}
        onCheckout={mockOnCheckout}
      />,
    );

    expect(screen.getByText("Productos (3)")).toBeInTheDocument();
    expect(screen.getByText("3 items")).toBeInTheDocument();
  });

  it("should render subtotal", () => {
    renderWithRouter(
      <CartSummary
        subtotal={250.5}
        itemCount={2}
        onCheckout={mockOnCheckout}
      />,
    );

    expect(screen.getByText("$250.50")).toBeInTheDocument();
  });

  it("should render shipping cost when subtotal is below free shipping threshold", () => {
    renderWithRouter(
      <CartSummary
        subtotal={400}
        itemCount={2}
        onCheckout={mockOnCheckout}
      />,
    );

    expect(screen.getByText("$50.00")).toBeInTheDocument();
    expect(screen.getByText(/Agrega/)).toBeInTheDocument();
  });

  it("should show free shipping when subtotal exceeds threshold", () => {
    renderWithRouter(
      <CartSummary
        subtotal={600}
        itemCount={2}
        onCheckout={mockOnCheckout}
      />,
    );

    expect(screen.getByText("Gratis")).toBeInTheDocument();
  });

  it("should render total with shipping", () => {
    renderWithRouter(
      <CartSummary
        subtotal={400}
        itemCount={2}
        onCheckout={mockOnCheckout}
      />,
    );

    // 400 + 50 = 450
    expect(screen.getByText("$450.00")).toBeInTheDocument();
  });

  it("should render checkout button", () => {
    renderWithRouter(
      <CartSummary
        subtotal={100}
        itemCount={3}
        onCheckout={mockOnCheckout}
      />,
    );

    expect(screen.getByText("Proceder al Pago")).toBeInTheDocument();
  });

  it("should show 'Carrito vacío' when itemCount is 0", () => {
    renderWithRouter(
      <CartSummary
        subtotal={0}
        itemCount={0}
        onCheckout={mockOnCheckout}
      />,
    );

    expect(screen.getByText("Carrito vacío")).toBeInTheDocument();
  });

  it("should show 'Iniciar Sesión para Comprar' when not authenticated", () => {
    renderWithRouter(
      <CartSummary
        subtotal={100}
        itemCount={2}
        onCheckout={mockOnCheckout}
        isAuthenticated={false}
      />,
    );

    expect(screen.getByText("Iniciar Sesión para Comprar")).toBeInTheDocument();
  });

  it("should show free shipping notice when below threshold", () => {
    renderWithRouter(
      <CartSummary
        subtotal={300}
        itemCount={2}
        onCheckout={mockOnCheckout}
      />,
    );

    expect(screen.getByText(/Agrega/)).toBeInTheDocument();
    expect(screen.getByText(/más para obtener envío gratis/)).toBeInTheDocument();
  });

  it("should render continue shopping link", () => {
    renderWithRouter(
      <CartSummary
        subtotal={100}
        itemCount={2}
        onCheckout={mockOnCheckout}
      />,
    );

    expect(screen.getByText("← Continuar Comprando")).toBeInTheDocument();
  });
});