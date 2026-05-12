/**
 * Product domain types
 * Defines TypeScript interfaces for products, ingredients, categories, and pagination
 */

/**
 * Ingredient type
 * Represents a product ingredient with allergen information
 */
export interface Ingrediente {
  id: string;
  nombre: string;
  es_alergeno: boolean;
}

/**
 * Category type
 * Represents a product category
 */
export interface Categoria {
  id: string;
  nombre: string;
}

/**
 * Complete product type (admin view)
 * Includes full stock information and administrative fields
 */
export interface Product {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: string; // Decimal as string to avoid floating point errors
  stock: number;
  imagen_url?: string;
  disponible: boolean;
  categorias: Categoria[];
  ingredientes: Ingrediente[];
  creado_en: string; // ISO date string
}

/**
 * Public product type
 * Frontend representation without exact stock quantity
 * Only shows availability status (disponible: boolean)
 */
export interface ProductPublic {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: string;
  disponible: boolean; // Only this, no exact stock
  imagen_url?: string;
  categorias: Categoria[];
  ingredientes: Ingrediente[];
  creado_en: string;
}

/**
 * Pagination response metadata
 * Sent with list endpoints to support client-side pagination
 */
export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Product list API response
 * Contains paginated product data and metadata
 */
export interface ProductListResponse {
  data: ProductPublic[];
  pagination: PaginationResponse;
}

/**
 * Create product request schema
 * Used when admin creates a new product
 */
export interface ProductCreate {
  nombre: string;
  descripcion?: string;
  precio: string; // Decimal as string
  stock: number;
  imagen_url?: string;
  disponible?: boolean;
  categorias_ids?: string[];
  ingredientes_ids?: string[];
}

/**
 * Update product request schema
 * All fields optional for PATCH/PUT operations
 */
export interface ProductUpdate {
  nombre?: string;
  descripcion?: string;
  precio?: string;
  stock?: number;
  imagen_url?: string;
  disponible?: boolean;
  categorias_ids?: string[];
  ingredientes_ids?: string[];
}

/**
 * Product list filters
 * Query parameters for filtering products
 */
export interface ProductFilters {
  page?: number;
  limit?: number;
  categoria_id?: string;
  search?: string;
  excluirAlergenos?: string[];
}
