/**
 * HomePage - Home page with product catalog
 */
import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/store/authStore';
import { ProductFilterBar } from '../features/products/components/ProductFilterBar';
import { ProductGrid } from '../features/products/components/ProductGrid';
import { ProductPublic, ProductFilters } from '../features/products/types';

export const HomePage: React.FC = () => {
  const { isAuthenticated, user, logout, refreshToken } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<ProductFilters>({
    categoria_id: searchParams.get('category') || undefined,
  });

  const handleLogout = async () => {
    if (refreshToken && isAuthenticated) {
      // API logout call would happen here
      logout();
    }
  };

  const handleProductSelect = (product: ProductPublic) => {
    navigate(`/products/${product.id}`);
  };

  const handleFilter = (newFilters: ProductFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Food Store</h1>
          <div className="flex gap-4 items-center">
            {isAuthenticated ? (
              <>
                <span className="text-gray-700">Welcome, {user?.nombre}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Food Store
          </h2>
          <p className="text-xl text-gray-600">
            Your one-stop shop for quality food products
          </p>
        </div>

        {isAuthenticated && (
          <div className="bg-blue-50 p-4 rounded-lg mb-8">
            <p className="text-blue-800">
              <span className="font-semibold">Member since:</span>{' '}
              {user?.creado_en ? new Date(user.creado_en).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        )}

        {/* Product Catalog Section */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Our Products
          </h3>

          {/* Filter Bar */}
          <ProductFilterBar onFilter={handleFilter} />

          {/* Product Grid */}
          <ProductGrid
            filters={filters}
            onProductSelect={handleProductSelect}
          />
        </div>
      </main>
    </div>
  );
};
