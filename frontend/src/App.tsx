import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { HomePage } from './pages/HomePage'
import { ProtectedRoute } from './features/auth/components/ProtectedRoute'
import { useAuthStore } from './features/auth/store/authStore'

// Placeholder pages for other features
function CatalogPage() {
  return <h1 className="text-2xl font-bold p-4">Catalog</h1>
}

function CartPage() {
  return <h1 className="text-2xl font-bold p-4">Cart</h1>
}

function OrdersPage() {
  return <h1 className="text-2xl font-bold p-4">My Orders</h1>
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <a href="/" className="text-xl font-bold text-green-600">
                Food Store
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/catalog" className="text-gray-600 hover:text-gray-900">
                Catalog
              </a>
              <a href="/cart" className="text-gray-600 hover:text-gray-900">
                Cart
              </a>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          
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
  )
}