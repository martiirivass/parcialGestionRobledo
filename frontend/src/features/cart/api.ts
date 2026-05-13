/**
 * Cart API client
 * Handles stock validation and cart-related HTTP calls
 * Uses centralized apiClient with JWT interceptors
 */

import apiClient from "../../shared/api/axios";

export interface ProductStockResponse {
  id: number;
  nombre: string;
  descripcion?: string;
  imagen?: string;
  precio: number;
  stock_cantidad: number;
  disponible: boolean;
}

/**
 * Validate if a product has sufficient stock for a given quantity
 * @param productoId - Product ID
 * @param cantidad - Requested quantity
 * @returns Promise<boolean> - true if stock is available, false otherwise
 */
export async function validateProductStock(
  productoId: number,
  cantidad: number,
): Promise<boolean> {
  try {
    const response = await apiClient.get<ProductStockResponse>(
      `/productos/${productoId}`,
    );
    const product = response.data;

    // Check if product is available and has sufficient stock
    if (!product.disponible) {
      console.warn(
        `Product ${productoId} is not available for purchase`,
      );
      return false;
    }

    if (product.stock_cantidad < cantidad) {
      console.warn(
        `Insufficient stock for product ${productoId}. Available: ${product.stock_cantidad}, requested: ${cantidad}`,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error validating stock for product ${productoId}:`, error);
    // If we can't verify, assume not available for safety
    return false;
  }
}

/**
 * Get product details by ID (for cart item validation/refresh)
 * @param productoId - Product ID
 * @returns Promise containing product details or null if not found
 */
export async function getProductForCart(
  productoId: number,
): Promise<ProductStockResponse | null> {
  try {
    const response = await apiClient.get<ProductStockResponse>(
      `/productos/${productoId}`,
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching product ${productoId} for cart:`, error);
    return null;
  }
}