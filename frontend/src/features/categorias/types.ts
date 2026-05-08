/**
 * Category TypeScript types and interfaces
 * Defines data structures for the hierarchical category system
 */

/**
 * Base category interface
 * Contains all fields returned by the API
 */
export interface Category {
  id: string;
  nombre: string;
  padre_id: string | null;
  creado_en: string;
  actualizado_en: string;
  eliminado_en: string | null;
}

/**
 * Category tree node with nested subcategories
 * Used in hierarchical category responses
 */
export interface CategoryTreeNode extends Category {
  subcategorias: CategoryTreeNode[];
}

/**
 * Payload for creating a new category
 */
export interface CategoryCreate {
  nombre: string;
  padre_id?: string | null;
}

/**
 * Payload for updating an existing category
 */
export interface CategoryUpdate {
  nombre?: string;
  padre_id?: string | null;
}

/**
 * API error response structure
 */
export interface CategoryErrorResponse {
  detail: string;
  status?: number;
}

/**
 * Expand/collapse state for tree nodes
 */
export interface TreeNodeExpandState {
  [key: string]: boolean;
}
