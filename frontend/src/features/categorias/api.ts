/**
 * API client functions for category operations
 * Handles communication with backend /api/v1/categorias endpoints
 */
import apiClient from '../../shared/api/client';
import {
  Category,
  CategoryTreeNode,
  CategoryCreate,
  CategoryUpdate,
} from './types';

const API_PREFIX = '/api/v1/categorias';

/**
 * Fetch complete category hierarchy tree
 * Public endpoint - no authentication required
 */
export const fetchCategoryTree = async (): Promise<CategoryTreeNode[]> => {
  try {
    const response = await apiClient.get<CategoryTreeNode[]>(API_PREFIX);
    return response.data;
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to fetch category tree'
    );
  }
};

/**
 * Create new category (admin/stock only)
 */
export const createCategory = async (
  data: CategoryCreate
): Promise<Category> => {
  try {
    const response = await apiClient.post<Category>(API_PREFIX, data);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('409')) {
        throw new Error('Duplicate category name or has products');
      }
      if (error.message.includes('404')) {
        throw new Error('Parent category not found');
      }
      if (error.message.includes('400')) {
        throw new Error('Invalid category data');
      }
    }
    throw new Error(
      error instanceof Error ? error.message : 'Failed to create category'
    );
  }
};

/**
 * Update category details (admin/stock only)
 */
export const updateCategory = async (
  id: string,
  data: CategoryUpdate
): Promise<Category> => {
  try {
    const response = await apiClient.put<Category>(
      `${API_PREFIX}/${id}`,
      data
    );
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('400')) {
        throw new Error('Invalid update data or would create a cycle');
      }
      if (error.message.includes('404')) {
        throw new Error('Category not found');
      }
    }
    throw new Error(
      error instanceof Error ? error.message : 'Failed to update category'
    );
  }
};

/**
 * Delete category (soft delete, admin/stock only)
 */
export const deleteCategory = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`${API_PREFIX}/${id}`);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('409')) {
        throw new Error(
          'Cannot delete category with products. Remove products first.'
        );
      }
      if (error.message.includes('404')) {
        throw new Error('Category not found');
      }
    }
    throw new Error(
      error instanceof Error ? error.message : 'Failed to delete category'
    );
  }
};

/**
 * Get category details (admin/stock only)
 */
export const getCategoryDetail = async (
  id: string,
  includeDeleted: boolean = false
): Promise<Category> => {
  try {
    const response = await apiClient.get<Category>(
      `${API_PREFIX}/${id}?includeDeleted=${includeDeleted}`
    );
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('404')) {
        throw new Error('Category not found');
      }
    }
    throw new Error(
      error instanceof Error ? error.message : 'Failed to fetch category'
    );
  }
};
