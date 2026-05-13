/**
 * EmptyCart component - Displayed when cart has no items
 * Provides call-to-action to continue shopping
 */
import { useNavigate } from "react-router-dom";

interface EmptyCartProps {
  onContinueShopping?: () => void;
}

export function EmptyCart({ onContinueShopping }: EmptyCartProps) {
  const navigate = useNavigate();

  const handleContinueShopping = () => {
    if (onContinueShopping) {
      onContinueShopping();
    } else {
      navigate("/catalog");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Empty Cart Icon */}
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>

      {/* Message */}
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        Tu carrito está vacío
      </h2>
      <p className="text-gray-500 text-center max-w-md mb-8">
        Looks like you haven't added any items to your cart yet.
        Browse our products and find something delicious!
      </p>

      {/* CTA Button */}
      <button
        onClick={handleContinueShopping}
        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
      >
        Ver Productos
      </button>

      {/* Additional Links */}
      <div className="mt-6 flex gap-4 text-sm">
        <button
          onClick={() => navigate("/")}
          className="text-gray-500 hover:text-green-600 transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}