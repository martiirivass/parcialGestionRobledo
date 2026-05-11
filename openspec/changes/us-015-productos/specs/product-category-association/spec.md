# Specification: Product-Category Association

**Capability**: `product-category-association`  
**Version**: 1.0  
**Status**: NEW  
**Last Updated**: 2026-05-11

## Overview

Many-to-many (M2M) relationships between products and categories. Enables products to belong to multiple categories and supports category-based filtering in the catalog.

## Data Model

### ProductoCategoria Table

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `producto_id` | UUID | PK, FK → productos(id), NOT NULL | Product reference |
| `categoria_id` | UUID | PK, FK → categorias(id), NOT NULL | Category reference |

**Constraints**:
- PRIMARY KEY (producto_id, categoria_id)
- UNIQUE (producto_id, categoria_id) to prevent duplicates
- Foreign keys with ON DELETE CASCADE (if product deleted, associations removed; if category deleted, associations removed)

**Indexes**:
- idx_producto_categoria_pid on producto_id
- idx_producto_categoria_cid on categoria_id

## API Contracts

### ASSIGN Categories to Product – `PUT /api/v1/productos/:id/categorias`

**Authentication**: Required (JWT)  
**Authorization**: ADMIN, STOCK roles only  
**Request Body**:
```json
{
  "categoria_ids": ["uuid", "uuid", ...]
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "nombre": "string",
  "categorias": [
    {"id": "uuid", "nombre": "string"}
  ]
}
```

**Behavior**:
- Replaces all existing category associations for the product
- Empty array removes all categories
- Each categoria_id must exist and not be soft-deleted

**Error Responses**:
- `400 Bad Request`: Invalid category UUID or category doesn't exist
- `401 Unauthorized`: No valid JWT token
- `403 Forbidden`: User lacks ADMIN/STOCK role
- `404 Not Found`: Product doesn't exist

## Business Rules

- A product can belong to 0 or more categories
- A category can have 0 or more products
- Assigning a category to a product makes it appear in that category's product listings
- Removing a category from a product removes it from that category's listings
- Hierarchical: if a product is assigned to "Fruits → Citrus", it appears in both "Fruits" and "Citrus" when listing (parent categories show children)

## Query Examples

**Get all products in a category (including subcategories)**:
```sql
SELECT DISTINCT p.*
FROM productos p
JOIN producto_categoria pc ON p.id = pc.producto_id
JOIN categorias c ON pc.categoria_id = c.id
WHERE c.id = :category_id
  OR c.padre_id = :category_id  -- direct children
  OR c.padre_id IN (SELECT id FROM categorias WHERE padre_id = :category_id)  -- nested hierarchy (CTE for arbitrary depth)
AND p.disponible = true
AND p.eliminado_en IS NULL
```

## Integration Points

- Used by `product-catalog-browsing` for category filtering
- Used by category pages to show products in that category
- Used by product detail pages to show product's categories

## Transaction Guarantees

- Atomic: All category assignments succeed or all fail
- Using Unit of Work pattern for data consistency
