/**
 * CartSummary component - Order summary with totals
 * Displays subtotal, item count, and checkout button
 */
import { useNavigate } from "react-router-dom";

interface CartSummaryProps {
  subtotal: number;
  itemCount: number;
  onCheckout?: () => void;
  isAuthenticated?: boolean;
}

export function CartSummary({
  subtotal,
  itemCount,
  onCheckout,
  isAuthenticated = false,
}: CartSummaryProps) {
  const navigate = useNavigate();

  // Fixed shipping cost (could be dynamic based on address)
  const shipping = subtotal > 500 ? 0 : 50; // Free shipping over $500
  const total = subtotal + shipping;

  const handleCheckout = () => {
    if (onCheckout) {
      onCheckout();
    } else {
      // Default: navigate to checkout or orders page
      if (isAuthenticated) {
        navigate("/orders?checkout=true");
      } else {
        navigate("/login?redirect=/orders?checkout=true");
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Resumen del Pedido
      </h2>

      {/* Item Count */}
      <div className="flex justify-between text-sm text-gray-600 mb-3">
        <span>Productos ({itemCount})</span>
        <span>{itemCount} items</span>
      </div>

      {/* Subtotal */}
      <div className="flex justify-between text-sm text-gray-600 mb-3">
        <span>Subtotal</span>
        <span>${subtotal.toFixed(2)}</span>
      </div>

      {/* Shipping */}
      <div className="flex justify-between text-sm text-gray-600 mb-4">
        <span>Costo de envío</span>
        <span className={shipping === 0 ? "text-green-600" : ""}>
          {shipping === 0 ? "Gratis" : `$${shipping.toFixed(2)}`}
        </span>
      </div>

      {/* Free shipping notice */}
      {subtotal < 500 && (
        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded mb-4">
          ¡Agrega ${(500 - subtotal).toFixed(2)} más para obtener envío gratis!
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-gray-200 my-4"></div>

      {/* Total */}
      <div className="flex justify-between items-center mb-6">
        <span className="text-lg font-bold text-gray-900">Total</span>
        <span className="text-2xl font-bold text-green-600">
          ${total.toFixed(2)}
        </span>
      </div>

      {/* Checkout Button */}
      <button
        onClick={handleCheckout}
        disabled={itemCount === 0}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
      >
        {itemCount === 0
          ? "Carrito vacío"
          : isAuthenticated
            ? "Proceder al Pago"
            : "Iniciar Sesión para Comprar"}
      </button>

      {/* Continue Shopping Link */}
      <button
        onClick={() => navigate("/catalog")}
        className="w-full mt-3 text-sm text-gray-600 hover:text-green-600 transition-colors"
      >
        ← Continuar Comprando
      </button>
    </div>
  );
}