/**
 * CategoryDetailPage
 * Display a specific category with its subcategories and products
 * Route: /categories/:categoryId
 */
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCategoriasStore } from '../features/categorias/store/categoriasStore';
import { CategoryTree } from '../features/categorias/components/CategoryTree';
import { CategoryTreeNode } from '../features/categorias/types';

/**
 * Simple breadcrumb component
 */
const Breadcrumb: React.FC<{ path: CategoryTreeNode[] }> = ({ path }) => {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex space-x-2 text-sm">
        <li>
          <Link to="/" className="text-blue-600 hover:text-blue-800">
            Home
          </Link>
        </li>
        {path.map((category, index) => (
          <li key={category.id}>
            <span className="text-gray-500">/</span>
            {index === path.length - 1 ? (
              <span className="ml-2 text-gray-600 font-medium">{category.nombre}</span>
            ) : (
              <Link
                to={`/categories/${category.id}`}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                {category.nombre}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

/**
 * Find category by ID in the tree
 */
function findCategoryInTree(
  categories: CategoryTreeNode[],
  targetId: string,
  path: CategoryTreeNode[] = []
): { category: CategoryTreeNode; path: CategoryTreeNode[] } | null {
  for (const category of categories) {
    if (category.id === targetId) {
      return { category, path: [...path, category] };
    }

    const result = findCategoryInTree(
      category.subcategorias || [],
      targetId,
      [...path, category]
    );

    if (result) {
      return result;
    }
  }

  return null;
}

interface CategoryDetailPageProps {}

export const CategoryDetailPage: React.FC<CategoryDetailPageProps> = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { categories, loading, error, fetchCategories } = useCategoriasStore();
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);

  // Fetch categories if not already loaded
  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories().catch((err) => {
        console.error('Failed to fetch categories:', err);
      });
    }
  }, [categories.length, fetchCategories]);

  // Find the current category
  const result = categoryId ? findCategoryInTree(categories, categoryId) : null;
  const category = result?.category;
  const breadcrumbPath = result?.path || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading category...</p>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Category Not Found</h1>
          <p className="text-gray-600 mb-4">
            {error || 'The category you are looking for does not exist.'}
          </p>
          <Link
            to="/"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    );
  }

  const hasSubcategories =
    category.subcategorias && category.subcategorias.length > 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb path={breadcrumbPath} />

      {/* Category Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{category.nombre}</h1>
        <p className="text-gray-600">
          Explore products in this category and its subcategories.
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Subcategories */}
        {hasSubcategories && (
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-20">
              <h3 className="font-bold text-lg text-gray-900 mb-4">Subcategories</h3>
              <CategoryTree
                categories={category.subcategorias || []}
                onSelectCategory={(id) => {
                  setSelectedSubcategoryId(id);
                  navigate(`/categories/${id}`);
                }}
                selectedCategoryId={selectedSubcategoryId}
                expandable={true}
              />
            </div>
          </aside>
        )}

        {/* Main Content - Products */}
        <main className={hasSubcategories ? 'lg:col-span-3' : 'lg:col-span-4'}>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Products</h2>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500"
                defaultValue="name-asc"
              >
                <option value="name-asc">Sort by Name (A-Z)</option>
                <option value="name-desc">Sort by Name (Z-A)</option>
                <option value="price-asc">Sort by Price (Low to High)</option>
                <option value="price-desc">Sort by Price (High to Low)</option>
              </select>
            </div>

            {/* Products Grid - Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-gray-500 text-center">
                  Products will be displayed here in Phase 3
                </p>
              </div>
            </div>

            {/* Pagination - Placeholder */}
            <div className="mt-6 flex justify-center gap-2">
              <button className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-blue-600 text-white">
                1
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CategoryDetailPage;
