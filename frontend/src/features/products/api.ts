/**
 * Products API client
 * Handles HTTP communication with backend products endpoints
 * Uses centralized apiClient with JWT interceptors
 */

import apiClient from '../../shared/api/axios';
import {
  ProductPublic,
  ProductCreate,
  ProductUpdate,
  ProductListResponse,
  ProductFilters,
  Product,
} from './types';

/**
 * Fetch list of products with pagination and filters
 * @param filters - Query parameters: page, limit, categoria_id, search, excluirAlergenos
 * @returns Promise containing paginated product list
 * @throws Error if request fails
 */
export async function getProducts(filters: ProductFilters = {}): Promise<ProductListResponse> {
  try {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.categoria_id) params.append('categoria_id', filters.categoria_id);
    if (filters.search) params.append('busqueda', filters.search);
    if (filters.excluirAlergenos && filters.excluirAlergenos.length > 0) {
      filters.excluirAlergenos.forEach((id) => {
        params.append('excluirAlergenos', id);
      });
    }

    const response = await apiClient.get<ProductListResponse>('/productos', {
      params,
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

/**
 * Fetch single product by ID
 * @param id - Product UUID
 * @returns Promise containing product details
 * @throws Error if product not found or request fails
 */
export async function getProductById(id: string): Promise<ProductPublic> {
  try {
    const response = await apiClient.get<ProductPublic>(`/productos/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw error;
  }
}

/**
 * Create new product (admin/stock only)
 * @param data - Product creation data with name, price, stock, categories, ingredients
 * @returns Promise containing created product
 * @throws Error if validation fails or user not authorized
 */
export async function createProduct(data: ProductCreate): Promise<Product> {
  try {
    const response = await apiClient.post<Product>('/productos', data);
    return response.data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

/**
 * Update product details (admin/stock only)
 * @param id - Product UUID
 * @param data - Partial product data to update
 * @returns Promise containing updated product
 * @throws Error if product not found, validation fails, or user not authorized
 */
export async function updateProduct(id: string, data: ProductUpdate): Promise<Product> {
  try {
    const response = await apiClient.put<Product>(`/productos/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    throw error;
  }
}

/**
 * Delete product (soft delete - admin/stock only)
 * @param id - Product UUID
 * @returns Promise resolved on success
 * @throws Error if product not found or user not authorized
 */
export async function deleteProduct(id: string): Promise<void> {
  try {
    await apiClient.delete(`/productos/${id}`);
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    throw error;
  }
}

/**
 * Update product stock atomically (admin/stock only)
 * Prevents race conditions using database-level locking
 * @param id - Product UUID
 * @param cantidad - Stock increment/decrement (can be negative to decrease)
 * @returns Promise containing updated product with new stock
 * @throws Error if resulting stock would be negative or user not authorized
 */
export async function updateProductStock(
  id: string,
  cantidad: number
): Promise<Product> {
  try {
    const response = await apiClient.patch<Product>(`/productos/${id}/stock`, {
      cantidad,
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating product stock ${id}:`, error);
    throw error;
  }
}

/**
 * Assign categories to a product (admin/stock only)
 * Replaces existing category associations
 * @param id - Product UUID
 * @param categoria_ids - Array of category UUIDs to assign
 * @returns Promise containing product with updated categories
 * @throws Error if invalid category IDs or user not authorized
 */
export async function assignCategories(
  id: string,
  categoria_ids: string[]
): Promise<Product> {
  try {
    const response = await apiClient.put<Product>(`/productos/${id}/categorias`, {
      categoria_ids,
    });
    return response.data;
  } catch (error) {
    console.error(`Error assigning categories to product ${id}:`, error);
    throw error;
  }
}

/**
 * Assign ingredients to a product (admin/stock only)
 * Replaces existing ingredient associations
 * @param id - Product UUID
 * @param ingrediente_ids - Array of ingredient UUIDs to assign
 * @returns Promise containing product with updated ingredients
 * @throws Error if invalid ingredient IDs or user not authorized
 */
export async function assignIngredients(
  id: string,
  ingrediente_ids: string[]
): Promise<Product> {
  try {
    const response = await apiClient.put<Product>(`/productos/${id}/ingredientes`, {
      ingrediente_ids,
    });
    return response.data;
  } catch (error) {
    console.error(`Error assigning ingredients to product ${id}:`, error);
    throw error;
  }
}
