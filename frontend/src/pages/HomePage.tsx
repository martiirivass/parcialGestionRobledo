/**
 * HomePage - Home page with category browsing
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/store/authStore';
import { CategoryTreeContainer } from '../features/categorias/components/CategoryTreeContainer';

export const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    navigate(`/categories/${categoryId}`);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold mb-2">Welcome to Food Store 🥬</h1>
        <p className="text-lg opacity-90">
          Your one-stop shop for quality food products
        </p>
      </section>

      {/* User Info Section */}
      {isAuthenticated && (
        <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4">Welcome, {user?.nombre}!</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded border border-blue-100">
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-semibold text-gray-900">{user?.email}</p>
            </div>
            <div className="bg-white p-4 rounded border border-blue-100">
              <p className="text-sm text-gray-600">Roles</p>
              <p className="font-semibold text-gray-900">
                {user?.roles.map((r) => r.nombre).join(', ') || 'User'}
              </p>
            </div>
            <div className="bg-white p-4 rounded border border-blue-100">
              <p className="text-sm text-gray-600">Member Since</p>
              <p className="font-semibold text-gray-900">
                {user?.creado_en
                  ? new Date(user.creado_en).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Categories</h2>
            <CategoryTreeContainer
              onSelectCategory={handleCategorySelect}
              selectedCategoryId={selectedCategoryId}
              expandable={true}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-3 space-y-6">
          {/* Featured Section */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Placeholder cards */}
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
                >
                  <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded mb-3 flex items-center justify-center">
                    <span className="text-gray-400">Product {i}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Product {i}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    High-quality food product from our collection
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-green-600">$9.99</span>
                    <button className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm">
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Products will be fully integrated in Phase 3
            </p>
          </section>

          {/* Browse by Category CTA */}
          <section className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg shadow-sm p-6 border border-orange-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Browse by Category</h2>
            <p className="text-gray-700 mb-4">
              Explore our wide selection of fresh and quality food products organized by category.
              Click on any category on the left or use the Categories menu to get started.
            </p>
            <div className="flex gap-3">
              <Link
                to="/catalog"
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition font-medium"
              >
                View Full Catalog
              </Link>
              <button
                onClick={() => {
                  const sidebar = document.querySelector('[role="navigation"]');
                  sidebar?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2 border border-orange-600 text-orange-600 rounded-md hover:bg-orange-50 transition font-medium"
              >
                Browse Categories
              </button>
            </div>
          </section>

          {/* CTA for Authentication */}
          {!isAuthenticated && (
            <section className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Ready to Shop?</h2>
              <p className="text-gray-600 mb-4">
                Create an account or login to add items to your cart and complete your purchase.
              </p>
              <div className="flex gap-3">
                <Link
                  to="/register"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition font-medium"
                >
                  Sign Up
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 border border-green-600 text-green-600 rounded-md hover:bg-green-50 transition font-medium"
                >
                  Sign In
                </Link>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};
