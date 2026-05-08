/**
 * TypeScript types for Categories feature
 * Matches backend Category model and responses
 */

export interface Category {
  id: string;
  nombre: string;
  padre_id: string | null;
  creado_en: string;
  actualizado_en: string;
  eliminado_en: string | null;
}

export interface CategoryTreeNode extends Category {
  subcategorias: CategoryTreeNode[];
}

export interface CategoryCreate {
  nombre: string;
  padre_id?: string | null;
}

export interface CategoryUpdate {
  nombre?: string;
  padre_id?: string | null;
}

export interface CategoryDetail extends Category {
  descripcion?: string;
  producto_count?: number;
}
