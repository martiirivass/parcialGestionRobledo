/**
 * Header Component
 * Main navigation bar with categories dropdown
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/authStore';
import { CategoryTreeContainer } from '../../features/categorias/components/CategoryTreeContainer';

interface HeaderProps {
  onCategorySelect?: (categoryId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onCategorySelect }) => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const handleCategorySelect = (categoryId: string) => {
    onCategorySelect?.(categoryId);
    setShowCategoriesDropdown(false);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-green-600 hover:text-green-700">
              🥬 Food Store
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {/* Categories Dropdown */}
            <div className="relative group">
              <button
                onClick={() => setShowCategoriesDropdown(!showCategoriesDropdown)}
                className="text-gray-600 hover:text-gray-900 font-medium px-3 py-2 rounded-md inline-flex items-center gap-1"
              >
                Categories
                <svg
                  className={`w-4 h-4 transition-transform ${
                    showCategoriesDropdown ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showCategoriesDropdown && (
                <div
                  className="absolute left-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 p-4"
                  onMouseLeave={() => setShowCategoriesDropdown(false)}
                >
                  <CategoryTreeContainer
                    onSelectCategory={handleCategorySelect}
                    expandable={true}
                  />
                </div>
              )}
            </div>

            {/* Catalog Link */}
            <Link
              to="/catalog"
              className="text-gray-600 hover:text-gray-900 font-medium px-3 py-2 rounded-md"
            >
              Catalog
            </Link>

            {/* Cart Link */}
            <Link
              to="/cart"
              className="text-gray-600 hover:text-gray-900 font-medium px-3 py-2 rounded-md"
            >
              Cart
            </Link>
          </div>

          {/* User Menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-gray-700 text-sm">
                  {user?.nombre}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium text-sm"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden pb-4 space-y-2 border-t">
            <button
              onClick={() => setShowCategoriesDropdown(!showCategoriesDropdown)}
              className="w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md font-medium"
            >
              Categories
            </button>
            {showCategoriesDropdown && (
              <div className="pl-4 py-2 bg-gray-50 rounded">
                <CategoryTreeContainer
                  onSelectCategory={handleCategorySelect}
                  expandable={true}
                />
              </div>
            )}
            <Link
              to="/catalog"
              className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md font-medium"
              onClick={() => setShowMobileMenu(false)}
            >
              Catalog
            </Link>
            <Link
              to="/cart"
              className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md font-medium"
              onClick={() => setShowMobileMenu(false)}
            >
              Cart
            </Link>
            <hr className="my-2" />
            {isAuthenticated ? (
              <>
                <div className="px-3 py-2 text-sm text-gray-600">
                  {user?.nombre}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md font-medium"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
