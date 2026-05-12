/**
 * ProductGrid - Product list grid with pagination
 * Displays products in a responsive grid layout
 * Handles fetching, filtering, loading, and error states
 */

import React, { useEffect, useState } from "react";
import { ProductCard } from "./ProductCard";
import { ProductFilters, ProductPublic } from "../types";
import { useProducts } from "../store/productsStore";

interface ProductGridProps {
  filters?: ProductFilters;
  onProductSelect?: (product: ProductPublic) => void;
}

/**
 * ProductGrid component
 * Renders a grid of products with pagination controls
 * Responsive: 2 columns (mobile), 3 columns (tablet), 4 columns (desktop)
 */
export const ProductGrid: React.FC<ProductGridProps> = ({
  filters = {},
  onProductSelect,
}) => {
  const { products, isLoading, error, pagination, fetchProducts } =
    useProducts();

  const [currentPage, setCurrentPage] = useState(filters.page || 1);
  const [filterState, setFilterState] = useState<ProductFilters>(filters);

  /**
   * Fetch products on mount and when filters change
   */
  useEffect(() => {
    const mergedFilters: ProductFilters = {
      ...filterState,
      page: currentPage,
      limit: 12,
    };
    fetchProducts(mergedFilters);
  }, [filterState, currentPage, fetchProducts]);

  /**
   * Update filters and reset to page 1
   * (Note: Currently not used directly - filters are applied via useEffect)
   */
  // const handleFilterChange = (newFilters: ProductFilters) => {
  //   setFilterState(newFilters);
  //   setCurrentPage(1);
  // };

  /**
   * Handle pagination
   */
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < pagination.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleProductSelect = (product: ProductPublic) => {
    onProductSelect?.(product);
  };

  return (
    <div className="w-full">
      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <span className="ml-4 text-gray-600">Loading products...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Error loading products</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => fetchProducts(filterState)}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg mb-4">No products found</p>
          <button
            onClick={() => {
              setFilterState({});
              setCurrentPage(1);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Products Grid */}
      {!isLoading && products.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={handleProductSelect}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center items-center gap-4 mt-8 pb-8">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition-colors"
            >
              Previous
            </button>

            {/* Page Numbers */}
            <div className="flex gap-2 items-center">
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  let pageNumber;
                  if (pagination.totalPages <= 5) {
                    pageNumber = i + 1;
                  } else {
                    const startPage = Math.max(1, currentPage - 2);
                    pageNumber = startPage + i;
                  }
                  return pageNumber;
                },
              ).map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`px-3 py-1 rounded transition-colors ${
                    currentPage === pageNumber
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
            </div>

            <span className="text-gray-600 text-sm">
              Page {currentPage} of {pagination.totalPages}
            </span>

            <button
              onClick={handleNextPage}
              disabled={currentPage >= pagination.totalPages}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition-colors"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};
