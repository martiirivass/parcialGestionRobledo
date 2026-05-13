/**
 * CartItem component - Individual item in the shopping cart
 * Displays product info, quantity controls, and remove option
 */
import { useState } from "react";
import { CartItem as CartItemType } from "../types";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productoId: number, cantidad: number) => void;
  onRemove: (productoId: number) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity > 0 && newQuantity <= item.producto.stock_cantidad) {
      onUpdateQuantity(item.productoId, newQuantity);
    }
  };

  const handleRemove = () => {
    setIsRemoving(true);
    // Small delay for animation
    setTimeout(() => {
      onRemove(item.productoId);
    }, 200);
  };

  const subtotal = item.producto.precio * item.cantidad;

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 transition-all duration-200 ${
        isRemoving ? "opacity-0 scale-95" : "opacity-100"
      }`}
    >
      <div className="flex gap-4">
        {/* Product Image */}
        <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
          {item.producto.imagen ? (
            <img
              src={item.producto.imagen}
              alt={item.producto.nombre}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {item.producto.nombre}
          </h3>
          {item.producto.descripcion && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {item.producto.descripcion}
            </p>
          )}

          {/* Personalization info */}
          {item.personalizacion.length > 0 && (
            <div className="mt-2 text-xs text-amber-600">
              <span className="font-medium">Sin:</span>{" "}
              {item.personalizacion.join(", ")}
            </div>
          )}

          {/* Price and Quantity */}
          <div className="mt-3 flex items-center justify-between">
            <div className="text-lg font-bold text-green-600">
              ${item.producto.precio.toFixed(2)}
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuantityChange(item.cantidad - 1)}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={item.cantidad <= 1}
                aria-label="Decrease quantity"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 12H4"
                  />
                </svg>
              </button>

              <span className="w-10 text-center font-medium text-gray-900">
                {item.cantidad}
              </span>

              <button
                onClick={() => handleQuantityChange(item.cantidad + 1)}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={item.cantidad >= item.producto.stock_cantidad}
                aria-label="Increase quantity"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Remove Button */}
        <button
          onClick={handleRemove}
          className="self-start p-2 text-gray-400 hover:text-red-500 transition-colors"
          aria-label="Remove item"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {/* Subtotal */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
        <span className="text-sm text-gray-500">Subtotal</span>
        <span className="text-lg font-bold text-gray-900">
          ${subtotal.toFixed(2)}
        </span>
      </div>
    </div>
  );
}