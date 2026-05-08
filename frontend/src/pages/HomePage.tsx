/**
 * HomePage - Home page (placeholder)
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../features/auth/store/authStore';

export const HomePage: React.FC = () => {
  const { isAuthenticated, user, logout, refreshToken } = useAuthStore();

  const handleLogout = async () => {
    if (refreshToken && isAuthenticated) {
      // API logout call would happen here
      logout();
    }
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
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Food Store
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Your one-stop shop for quality food products
          </p>

          {isAuthenticated ? (
            <div className="bg-blue-50 p-8 rounded-lg">
              <h3 className="text-xl font-semibold text-blue-900 mb-2">
                Account Information
              </h3>
              <p className="text-blue-800">Email: {user?.email}</p>
              <p className="text-blue-800">
                Roles: {user?.roles.map((r) => r.nombre).join(', ')}
              </p>
              <p className="text-blue-800">
                Member since: {user?.creado_en ? new Date(user.creado_en).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          ) : (
            <p className="text-gray-600 mb-8">
              Please login or register to access all features
            </p>
          )}
        </div>
      </main>
    </div>
  );
};
