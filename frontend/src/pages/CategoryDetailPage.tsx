/**
 * Category Detail Page
 * Shows category details, subcategories, and products
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCategoriasStore } from '../features/categorias/store/categoriasStore';
import { CategoryTree } from '../features/categorias/components/CategoryTree';
import { CategoryTreeNode } from '../features/categorias/types';

interface BreadcrumbItem {
  id: string;
  nombre: string;
}

export const CategoryDetailPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { categories } = useCategoriasStore();
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryTreeNode | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc'>('name');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Find category by ID in the tree
  const findCategoryInTree = (
    nodes: CategoryTreeNode[],
    id: string,
    parents: CategoryTreeNode[] = []
  ): { category: CategoryTreeNode | null; path: BreadcrumbItem[] } => {
    for (const node of nodes) {
      if (node.id === id) {
        const path = [
          ...parents,
          { id: node.id, nombre: node.nombre },
        ];
        return { category: node, path: path.map(p => ({ id: p.id, nombre: p.nombre })) };
      }
      if (node.subcategorias && node.subcategorias.length > 0) {
        const result = findCategoryInTree(node.subcategorias, id, [
          ...parents,
          node,
        ]);
        if (result.category) {
          return result;
        }
      }
    }
    return { category: null, path: [] };
  };

  // Initialize category and breadcrumb
  useEffect(() => {
    if (categoryId && categories.length > 0) {
      const { category, path } = findCategoryInTree(categories, categoryId);
      if (category) {
        setSelectedCategory(category);
        setBreadcrumb(path);
      } else {
        navigate('/');
      }
    }
  }, [categoryId, categories]);

  // Handle subcategory selection
  const handleSubcategorySelect = (id: string) => {
    navigate(`/categories/${id}`);
  };

  if (!selectedCategory) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Loading category...</p>
        </div>
      </div>
    );
  }

  const allProducts = [
    // Placeholder products - will be replaced with API call in Phase 3
    ...Array.from({ length: 24 }, (_, i) => ({
      id: `prod-${i + 1}`,
      nombre: `Product ${i + 1}`,
      price: Math.random() * 50 + 5,
      image: `https://via.placeholder.com/200?text=Product+${i + 1}`,
    })),
  ];

  // Sort products
  let sortedProducts = [...allProducts];
  if (sortBy === 'name') {
    sortedProducts.sort((a, b) => a.nombre.localeCompare(b.nombre));
  } else if (sortBy === 'price-asc') {
    sortedProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-desc') {
    sortedProducts.sort((a, b) => b.price - a.price);
  }

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link to="/" className="text-blue-600 hover:underline">
          Home
        </Link>
        {breadcrumb.map((item, index) => (
          <React.Fragment key={item.id}>
            <span className="text-gray-400">/</span>
            {index === breadcrumb.length - 1 ? (
              <span className="text-gray-900 font-medium">{item.nombre}</span>
            ) : (
              <Link
                to={`/categories/${item.id}`}
                className="text-blue-600 hover:underline"
              >
                {item.nombre}
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Subcategories */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Subcategories
            </h3>
            {selectedCategory.subcategorias &&
            selectedCategory.subcategorias.length > 0 ? (
              <CategoryTree
                categories={selectedCategory.subcategorias}
                onSelectCategory={handleSubcategorySelect}
                expandable={true}
              />
            ) : (
              <p className="text-sm text-gray-500">No subcategories</p>
            )}
          </div>
        </aside>

        {/* Main Content: Products */}
        <main className="lg:col-span-3 space-y-6">
          {/* Category Header */}
          <section className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-gray-200 p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {selectedCategory.nombre}
            </h1>
            <p className="text-gray-600 mb-4">
              Browse {allProducts.length} products in this category
            </p>
            <div className="flex gap-2">
              <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {allProducts.length} items
              </span>
            </div>
          </section>

          {/* Sorting Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600">
              Showing {paginatedProducts.length} of {sortedProducts.length} products
            </div>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="name">Sort by Name (A-Z)</option>
              <option value="price-asc">Sort by Price (Low to High)</option>
              <option value="price-desc">Sort by Price (High to Low)</option>
            </select>
          </div>

          {/* Products Grid */}
          {paginatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden border border-gray-200"
                >
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.nombre}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 truncate">
                      {product.nombre}
                    </h3>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-green-600 text-lg">
                        ${product.price.toFixed(2)}
                      </span>
                      <button className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm font-medium">
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-500">No products in this category yet</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    page === currentPage
                      ? 'bg-green-600 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CategoryDetailPage;
