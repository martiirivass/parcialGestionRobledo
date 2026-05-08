/**
 * Category API client
 * Provides functions to interact with the category endpoints
 */
import apiClient from '../../shared/api/axios';
import {
  Category,
  CategoryTreeNode,
  CategoryCreate,
  CategoryUpdate,
  CategoryErrorResponse,
} from './types';

const API_ENDPOINT = '/categorias';

/**
 * Fetch the complete category tree (public endpoint)
 * No authentication required
 * @returns Promise with nested category tree
 * @throws Error if API request fails
 */
export const fetchCategoryTree = async (): Promise<CategoryTreeNode[]> => {
  try {
    const response = await apiClient.get<CategoryTreeNode[]>(API_ENDPOINT);
    return response.data;
  } catch (error) {
    const errorMsg = extractErrorMessage(error);
    throw new Error(`Failed to fetch category tree: ${errorMsg}`);
  }
};

/**
 * Get a single category by ID (admin only)
 * Requires ADMIN or STOCK role
 * @param id - Category ID
 * @param includeDeleted - Include soft-deleted categories
 * @returns Promise with category data
 * @throws Error if not found or unauthorized
 */
export const getCategoryDetail = async (
  id: string,
  includeDeleted: boolean = false
): Promise<Category> => {
  try {
    const response = await apiClient.get<Category>(
      `${API_ENDPOINT}/${id}`,
      {
        params: { includeDeleted },
      }
    );
    return response.data;
  } catch (error) {
    const statusCode = extractStatusCode(error);
    if (statusCode === 404) {
      throw new Error('Category not found');
    }
    if (statusCode === 403) {
      throw new Error('You do not have permission to view this category');
    }
    const errorMsg = extractErrorMessage(error);
    throw new Error(`Failed to fetch category: ${errorMsg}`);
  }
};

/**
 * Create a new category (admin only)
 * Requires ADMIN or STOCK role
 * @param data - Category creation payload
 * @returns Promise with created category
 * @throws Error if invalid data or duplicate name
 */
export const createCategory = async (data: CategoryCreate): Promise<Category> => {
  try {
    const response = await apiClient.post<Category>(API_ENDPOINT, data);
    return response.data;
  } catch (error) {
    const statusCode = extractStatusCode(error);
    if (statusCode === 409) {
      throw new Error('A category with this name already exists in the parent');
    }
    if (statusCode === 404) {
      throw new Error('Parent category not found');
    }
    if (statusCode === 400) {
      throw new Error('Invalid category data. Check all required fields');
    }
    if (statusCode === 403) {
      throw new Error('You do not have permission to create categories');
    }
    const errorMsg = extractErrorMessage(error);
    throw new Error(`Failed to create category: ${errorMsg}`);
  }
};

/**
 * Update an existing category (admin only)
 * Requires ADMIN or STOCK role
 * @param id - Category ID
 * @param data - Category update payload
 * @returns Promise with updated category
 * @throws Error if not found, invalid parent, or cycle detected
 */
export const updateCategory = async (
  id: string,
  data: CategoryUpdate
): Promise<Category> => {
  try {
    const response = await apiClient.put<Category>(`${API_ENDPOINT}/${id}`, data);
    return response.data;
  } catch (error) {
    const statusCode = extractStatusCode(error);
    if (statusCode === 404) {
      throw new Error('Category not found');
    }
    if (statusCode === 400) {
      throw new Error('Invalid update: cycle detected or parent not found');
    }
    if (statusCode === 409) {
      throw new Error('Duplicate category name in parent');
    }
    if (statusCode === 403) {
      throw new Error('You do not have permission to update categories');
    }
    const errorMsg = extractErrorMessage(error);
    throw new Error(`Failed to update category: ${errorMsg}`);
  }
};

/**
 * Delete a category (soft delete - admin only)
 * Requires ADMIN or STOCK role
 * @param id - Category ID
 * @throws Error if category has active products or unauthorized
 */
export const deleteCategory = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`${API_ENDPOINT}/${id}`);
  } catch (error) {
    const statusCode = extractStatusCode(error);
    if (statusCode === 404) {
      throw new Error('Category not found');
    }
    if (statusCode === 409) {
      throw new Error('Cannot delete category: it has active products');
    }
    if (statusCode === 403) {
      throw new Error('You do not have permission to delete categories');
    }
    const errorMsg = extractErrorMessage(error);
    throw new Error(`Failed to delete category: ${errorMsg}`);
  }
};

/**
 * Extract error message from various error types
 * @param error - Error object from axios or any other source
 * @returns Error message string
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosError = error as { response?: { data?: CategoryErrorResponse } };
    if (
      axiosError.response?.data?.detail &&
      typeof axiosError.response.data.detail === 'string'
    ) {
      return axiosError.response.data.detail;
    }
  }
  return 'Unknown error occurred';
}

/**
 * Extract HTTP status code from various error types
 * @param error - Error object from axios or any other source
 * @returns HTTP status code or undefined
 */
function extractStatusCode(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosError = error as { response?: { status?: number } };
    return axiosError.response?.status;
  }
  return undefined;
}
