import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { HomePage } from './pages/HomePage'
import { CategoryDetailPage } from './pages/CategoryDetailPage'
import { ProtectedRoute } from './features/auth/components/ProtectedRoute'
import { Header, Footer } from './widgets'

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
  const handleCategorySelect = (categoryId: string) => {
    // Navigate to category detail page
    window.location.href = `/categories/${categoryId}`
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header onCategorySelect={handleCategorySelect} />
      
      {/* Main content */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/categories/:categoryId" element={<CategoryDetailPage />} />
          
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

      {/* Footer */}
      <Footer />
    </div>
  )
}