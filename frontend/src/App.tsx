import { Routes, Route, Navigate, Link } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { HomePage } from "./pages/HomePage";
import { ProductDetailPage } from "./features/products/components/ProductDetailPage";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";
import { CartPage } from "./features/cart/components/CartPage";
import { useAuthStore } from "./features/auth/store/authStore";
import { useCartStore } from "./features/cart/store/cartStore";

// Placeholder pages for other features
function CatalogPage() {
  return <h1 className="text-2xl font-bold p-4">Catalog</h1>;
}

function OrdersPage() {
  return <h1 className="text-2xl font-bold p-4">My Orders</h1>;
}

// Header component with cart badge
function Header() {
  const { isAuthenticated } = useAuthStore();
  const itemCount = useCartStore((state) => state.getItemCount());

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-green-600">
              Food Store
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            <Link
              to="/catalog"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Catálogo
            </Link>
            <Link
              to="/cart"
              className="relative text-gray-600 hover:text-gray-900 transition-colors flex items-center"
              aria-label={`Cart with ${itemCount} items`}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>
            {isAuthenticated ? (
              <Link
                to="/orders"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Mis Pedidos
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />

          {/* Protected routes */}
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}