/**
 * CategoryTreeContainer Component
 * Connects CategoryTree component to the Zustand store
 * Handles data fetching, loading, and error states
 */
import React, { useEffect } from 'react';
import { useCategoriasStore } from '../store/categoriasStore';
import { CategoryTree } from './CategoryTree';
import { CategoryTreeNode } from '../types';

interface CategoryTreeContainerProps {
  onSelectCategory?: (id: string) => void;
  selectedCategoryId?: string | null;
  expandable?: boolean;
}

/**
 * Container component that manages category fetching and state
 * Displays loading spinner during fetch and error message if failed
 */
export const CategoryTreeContainer: React.FC<CategoryTreeContainerProps> = ({
  onSelectCategory,
  selectedCategoryId,
  expandable = true,
}) => {
  const { categories, loading, error, fetchCategories } = useCategoriasStore();

  // Fetch categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        await fetchCategories();
      } catch (err) {
        // Error is already stored in the store
        console.error('Failed to fetch categories:', err);
      }
    };

    loadCategories();
  }, [fetchCategories]);

  if (loading) {
    return (
      <div className="px-4 py-3 text-center">
        <div className="inline-block">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
        </div>
        <p className="text-sm text-gray-500 mt-2">Loading categories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-3 bg-red-50 border border-red-200 rounded">
        <p className="text-sm text-red-600 font-medium">Error loading categories</p>
        <p className="text-xs text-red-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <CategoryTree
      categories={categories as CategoryTreeNode[]}
      onSelectCategory={onSelectCategory}
      selectedCategoryId={selectedCategoryId}
      expandable={expandable}
    />
  );
};

export default CategoryTreeContainer;
