/**
 * ProductDetailPage - Product details view
 * Displays full product information with ingredient customization
 * Accessible via /products/:id route
 */

import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useProducts } from "../store/productsStore";
import { useCartStore, Producto as CartProducto } from "../../cart/store/cartStore";
import { useAuthStore } from "../../auth/store/authStore";

/**
 * ProductDetailPage component
 * Shows product details with image, description, price, categories, and ingredients
 * Allows excluding ingredients (allergen management)
 * Includes "Add to Cart" functionality with quantity selection
 */
export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProduct, isLoading, error, fetchProductById } = useProducts();
  const { addItem, isLoading: cartLoading, error: cartError } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  // Use a default max quantity since ProductPublic doesn't expose exact stock
  const MAX_QUANTITY = 10;
  const [quantity, setQuantity] = useState(1);
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);
  const [addedToCart, setAddedToCart] = useState(false);

  /**
   * Fetch product on mount
   */
  useEffect(() => {
    if (id) {
      fetchProductById(id);
    }
  }, [id, fetchProductById]);

  /**
   * Reset added state when product changes
   */
  useEffect(() => {
    if (currentProduct) {
      setAddedToCart(false);
    }
  }, [currentProduct]);

  /**
   * Handle ingredient exclusion toggle
   */
  const handleToggleIngredientExclusion = (ingredientId: string) => {
    setExcludedIngredients((prev) =>
      prev.includes(ingredientId)
        ? prev.filter((id) => id !== ingredientId)
        : [...prev, ingredientId],
    );
  };

  /**
   * Handle add to cart with validation
   */
  const handleAddToCart = async () => {
    if (!currentProduct) return;

    // Check authentication
    if (!isAuthenticated) {
      navigate("/login?redirect=/products/" + id);
      return;
    }

    // Convert product to cart format
    const cartProducto: CartProducto = {
      id: parseInt(currentProduct.id, 10),
      nombre: currentProduct.nombre,
      descripcion: currentProduct.descripcion,
      imagen: currentProduct.imagen_url,
      precio: parseFloat(currentProduct.precio),
      stock_cantidad: MAX_QUANTITY, // Default since we don't have exact stock
      disponible: currentProduct.disponible,
    };

    // Try to add to cart
    const success = await addItem(
      cartProducto,
      quantity,
      excludedIngredients.map(Number),
    );

    if (success) {
      setAddedToCart(true);
      // Reset success message after 3 seconds
      setTimeout(() => setAddedToCart(false), 3000);
    }
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
          <p className="text-sm">
            {error || "The product you are looking for does not exist."}
          </p>
        </div>
        <button
          onClick={() => navigate("/")}
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
    "https://via.placeholder.com/600x600?text=" +
      encodeURIComponent(currentProduct.nombre);

  // Separate allergens and regular ingredients
  const allergens = currentProduct.ingredientes.filter((i) => i.es_alergeno);
  const regularIngredients = currentProduct.ingredientes.filter(
    (i) => !i.es_alergeno,
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          ← Volver
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-lg shadow-lg p-6 md:p-10">
          {/* Product Image */}
          <div>
            <img
              src={imageUrl}
              alt={currentProduct.nombre}
              className="w-full h-auto rounded-lg object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://via.placeholder.com/600x600?text=" +
                  encodeURIComponent(currentProduct.nombre);
              }}
            />

            {/* Availability Badge */}
            <div className="mt-4">
              <span
                className={`inline-block px-4 py-2 rounded-full text-sm font-semibold text-white ${
                  currentProduct.disponible ? "bg-green-500" : "bg-gray-400"
                }`}
              >
                {currentProduct.disponible
                  ? "✓ Disponible"
                  : "✗ Sin Stock"}
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
            {currentProduct.categorias &&
              currentProduct.categorias.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Categorías
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
                  ⚠️ Contiene Alérgenos
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
                  Ingredientes
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

            {/* Quantity Selector */}
            {currentProduct.disponible && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cantidad
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-semibold text-lg">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity((q) =>
                        Math.min(MAX_QUANTITY, q + 1),
                      )
                    }
                    className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                    disabled={quantity >= MAX_QUANTITY}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Cart Error Message */}
            {cartError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {cartError}
              </div>
            )}

            {/* Success Message */}
            {addedToCart && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                ¡Producto agregado al carrito!
                <Link
                  to="/cart"
                  className="ml-auto text-green-700 font-semibold hover:underline"
                >
                  Ver carrito →
                </Link>
              </div>
            )}

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={!currentProduct.disponible || cartLoading}
              className="w-full mt-auto px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {cartLoading ? (
                <>
                  <svg
                    className="w-5 h-5 animate-spin"
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
                  Agregando...
                </>
              ) : currentProduct.disponible ? (
                "Agregar al Carrito"
              ) : (
                "Sin Stock"
              )}
            </button>

            {/* Selected Exclusions Info */}
            {excludedIngredients.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
                <p className="font-semibold">
                  Exclusiones seleccionadas: {excludedIngredients.length}
                </p>
                <p className="text-xs mt-1">
                  Estos ingredientes serán excluidos de tu pedido.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};