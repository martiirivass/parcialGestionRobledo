/**
 * ProductCard - Individual product card component
 * Displays product information with hover effects
 * Memoized for performance optimization
 */

import React from "react";
import { ProductPublic } from "../types";

interface ProductCardProps {
  product: ProductPublic;
  onSelect?: (product: ProductPublic) => void;
}

/**
 * ProductCard component
 * Renders a single product with image, name, price, and availability status
 * Responsive design with hover effects and shadow transitions
 */
const ProductCardComponent: React.FC<ProductCardProps> = ({
  product,
  onSelect,
}) => {
  const handleClick = () => {
    onSelect?.(product);
  };

  // Format price to 2 decimal places
  const formattedPrice = parseFloat(product.precio).toFixed(2);

  // Placeholder image if none provided
  const imageUrl =
    product.imagen_url ||
    "https://via.placeholder.com/300x300?text=" +
      encodeURIComponent(product.nombre);

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 overflow-hidden cursor-pointer group"
    >
      {/* Product Image */}
      <div className="relative w-full h-48 bg-gray-200 overflow-hidden">
        <img
          src={imageUrl}
          alt={product.nombre}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://via.placeholder.com/300x300?text=" +
              encodeURIComponent(product.nombre);
          }}
        />

        {/* Availability Badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
              product.disponible ? "bg-green-500" : "bg-gray-400"
            }`}
          >
            {product.disponible ? "Available" : "Out of Stock"}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Product Name */}
        <h3 className="font-bold text-lg text-gray-800 mb-2 truncate">
          {product.nombre}
        </h3>

        {/* Categories */}
        {product.categorias && product.categorias.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.categorias.slice(0, 2).map((categoria) => (
              <span
                key={categoria.id}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
              >
                {categoria.nombre}
              </span>
            ))}
            {product.categorias.length > 2 && (
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                +{product.categorias.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <p className="text-2xl font-bold text-green-600 mb-2">
          ${formattedPrice}
        </p>

        {/* Allergen Info if exists */}
        {product.ingredientes &&
          product.ingredientes.some((i) => i.es_alergeno) && (
            <div className="text-xs text-red-600 font-semibold">
              ⚠️ Contains allergens
            </div>
          )}
      </div>
    </div>
  );
};

export const ProductCard = React.memo(ProductCardComponent);
