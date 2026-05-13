/**
 * CartPage - Main shopping cart page
 * Displays all cart items, summary, and checkout options
 */
import { useEffect } from "react";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../../auth/store/authStore";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";
import { EmptyCart } from "./EmptyCart";

export function CartPage() {
  const { items, getTotal, getItemCount, isLoading, error, setError } =
    useCartStore();
  const { isAuthenticated } = useAuthStore();

  const subtotal = getTotal();
  const itemCount = getItemCount();

  // Clear error on mount
  useEffect(() => {
    return () => {
      setError(null);
    };
  }, [setError]);

  // If cart is empty, show empty state
  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi Carrito</h1>
        <EmptyCart />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi Carrito</h1>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-500 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-blue-700">Validando disponibilidad...</span>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items Column */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <CartItem
              key={item.productoId}
              item={item}
              onUpdateQuantity={(productoId, cantidad) =>
                useCartStore.getState().updateQuantity(productoId, cantidad)
              }
              onRemove={(productoId) =>
                useCartStore.getState().removeItem(productoId)
              }
            />
          ))}

          {/* Clear Cart Button */}
          <div className="pt-4">
            <button
              onClick={() => useCartStore.getState().clearCart()}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              Vaciar carrito
            </button>
          </div>
        </div>

        {/* Summary Column */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <CartSummary
              subtotal={subtotal}
              itemCount={itemCount}
              isAuthenticated={isAuthenticated}
            />
          </div>
        </div>
      </div>
    </div>
  );
}