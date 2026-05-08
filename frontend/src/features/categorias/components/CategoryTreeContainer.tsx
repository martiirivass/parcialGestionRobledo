/**
 * Category Tree Container
 * Manages fetching and displaying category tree with loading/error states
 */
import React, { useEffect } from 'react';
import { useCategoriasStore } from '../store/categoriasStore';
import { CategoryTree } from './CategoryTree';

interface CategoryTreeContainerProps {
  onSelectCategory?: (id: string) => void;
  selectedCategoryId?: string | null;
  expandable?: boolean;
  className?: string;
}

export const CategoryTreeContainer: React.FC<CategoryTreeContainerProps> = ({
  onSelectCategory,
  selectedCategoryId,
  expandable = true,
  className = '',
}) => {
  const { categories, loading, error, fetchCategories, setSelectedCategory } =
    useCategoriasStore();

  // Fetch categories on mount
  useEffect(() => {
    if (categories.length === 0 && !loading) {
      fetchCategories();
    }
  }, []);

  // Handle category selection
  const handleSelect = (id: string) => {
    setSelectedCategory(id);
    onSelectCategory?.(id);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
          <span className="text-sm text-gray-600">Loading categories...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 rounded border border-red-200 ${className}`}>
        <p className="text-sm text-red-600 font-medium">Error loading categories</p>
        <p className="text-xs text-red-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <CategoryTree
        categories={categories}
        onSelectCategory={handleSelect}
        selectedCategoryId={selectedCategoryId}
        expandable={expandable}
      />
    </div>
  );
};

export default React.memo(CategoryTreeContainer);
