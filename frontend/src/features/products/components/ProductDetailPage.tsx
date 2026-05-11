/**
 * ProductDetailPage - Product details view
 * Displays full product information with ingredient customization
 * Accessible via /products/:id route
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProducts } from '../store/productsStore';

/**
 * ProductDetailPage component
 * Shows product details with image, description, price, categories, and ingredients
 * Allows excluding ingredients (allergen management)
 * Includes "Add to Cart" placeholder button
 */
export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProduct, isLoading, error, fetchProductById } = useProducts();
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);

  /**
   * Fetch product on mount
   */
  useEffect(() => {
    if (id) {
      fetchProductById(id);
    }
  }, [id, fetchProductById]);

  /**
   * Handle ingredient exclusion toggle
   */
  const handleToggleIngredientExclusion = (ingredientId: string) => {
    setExcludedIngredients((prev) =>
      prev.includes(ingredientId)
        ? prev.filter((id) => id !== ingredientId)
        : [...prev, ingredientId]
    );
  };

  /**
   * Handle add to cart (placeholder)
   */
  const handleAddToCart = () => {
    // TODO: Integrate with cart store
    console.log('Add to cart:', {
      productId: currentProduct?.id,
      excludedIngredients,
    });
    alert('Product added to cart! (Placeholder)');
  };

  /**
   * Loading state
   */
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
        <p className="text-gray-600">Loading product details...</p>
      </div>
    );
  }

  /**
   * Error state
   */
  if (error || !currentProduct) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6 max-w-md">
          <p className="font-bold mb-2">Product not found</p>
          <p className="text-sm">{error || 'The product you are looking for does not exist.'}</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
  }

  // Format price
  const formattedPrice = parseFloat(currentProduct.precio).toFixed(2);

  // Placeholder image
  const imageUrl =
    currentProduct.imagen_url ||
    'https://via.placeholder.com/600x600?text=' +
      encodeURIComponent(currentProduct.nombre);

  // Separate allergens and regular ingredients
  const allergens = currentProduct.ingredientes.filter((i) => i.es_alergeno);
  const regularIngredients = currentProduct.ingredientes.filter((i) => !i.es_alergeno);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="mb-6 px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
      >
        ← Back to Products
      </button>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-lg shadow-lg p-6 md:p-10">
          {/* Product Image */}
          <div>
            <img
              src={imageUrl}
              alt={currentProduct.nombre}
              className="w-full h-auto rounded-lg object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://via.placeholder.com/600x600?text=' +
                  encodeURIComponent(currentProduct.nombre);
              }}
            />

            {/* Availability Badge */}
            <div className="mt-4">
              <span
                className={`inline-block px-4 py-2 rounded-full text-sm font-semibold text-white ${
                  currentProduct.disponible
                    ? 'bg-green-500'
                    : 'bg-gray-400'
                }`}
              >
                {currentProduct.disponible ? '✓ Available' : '✗ Out of Stock'}
              </span>
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            {/* Name and Price */}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {currentProduct.nombre}
            </h1>
            <p className="text-4xl font-bold text-green-600 mb-6">
              ${formattedPrice}
            </p>

            {/* Description */}
            {currentProduct.descripcion && (
              <p className="text-gray-700 mb-6 leading-relaxed">
                {currentProduct.descripcion}
              </p>
            )}

            {/* Categories */}
            {currentProduct.categorias && currentProduct.categorias.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentProduct.categorias.map((cat) => (
                    <span
                      key={cat.id}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      {cat.nombre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Allergens Section */}
            {allergens.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                <h3 className="text-sm font-semibold text-red-900 mb-3">
                  ⚠️ Contains Allergens
                </h3>
                <div className="space-y-2">
                  {allergens.map((allergen) => (
                    <label
                      key={allergen.id}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={excludedIngredients.includes(allergen.id)}
                        onChange={() =>
                          handleToggleIngredientExclusion(allergen.id)
                        }
                        className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-red-800 font-medium">
                        {allergen.nombre}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Regular Ingredients */}
            {regularIngredients.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Ingredients
                </h3>
                <div className="space-y-2">
                  {regularIngredients.map((ingredient) => (
                    <label
                      key={ingredient.id}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={excludedIngredients.includes(ingredient.id)}
                        onChange={() =>
                          handleToggleIngredientExclusion(ingredient.id)
                        }
                        className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-gray-700">{ingredient.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={!currentProduct.disponible}
              className="w-full mt-auto px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {currentProduct.disponible ? 'Add to Cart' : 'Out of Stock'}
            </button>

            {/* Selected Exclusions Info */}
            {excludedIngredients.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
                <p className="font-semibold">Selected exclusions: {excludedIngredients.length}</p>
                <p className="text-xs mt-1">These ingredients will be noted in your order.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
