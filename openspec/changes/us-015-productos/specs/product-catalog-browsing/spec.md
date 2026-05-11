# Specification: Product Catalog Browsing

**Capability**: `product-catalog-browsing`  
**Version**: 1.0  
**Status**: NEW  
**Last Updated**: 2026-05-11

## Overview

The `product-catalog-browsing` capability provides public endpoints for customers to discover and view products. Includes pagination, filtering by category, search by name, and allergen filtering.

## API Contracts

### LIST Products – `GET /api/v1/productos`

**Authentication**: Not required  
**Authorization**: Public  
**Query Parameters**:
- `page` (integer, default=1): Pagination page number
- `limit` (integer, default=20, max=100): Items per page
- `categoria` (UUID, optional): Filter by category ID (includes subcategories)
- `busqueda` (string, optional): Search product name (ILIKE)
- `excluirAlergenos` (comma-separated UUIDs, optional): Exclude products containing these ingredient IDs

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "nombre": "string",
      "precio": "decimal string",
      "imagen_url": "string | null",
      "disponible": "boolean",
      "categorias": [{"id": "uuid", "nombre": "string"}]
    }
  ],
  "pagination": {
    "page": "integer",
    "limit": "integer",
    "total": "integer",
    "totalPages": "integer"
  }
}
```

**Behavior**:
- Returns only products with `disponible = true`, `stock > 0`, and `eliminado_en IS NULL`
- Pagination is required; returns max 100 items per request
- Search uses ILIKE on product name (case-insensitive partial match)
- Category filter includes products in subcategories (hierarchical)
- Allergen exclusion filters out products containing specified ingredient IDs

**Example**:
```
GET /api/v1/productos?categoria=cat-123&busqueda=pizza&excluirAlergenos=ing-45,ing-67&page=1&limit=20
```

## Data Model

Uses `producto` table with M2M relationships:
- `producto_categoria` for category associations
- `producto_ingrediente` for ingredient associations

## Query Strategy

```sql
SELECT DISTINCT p.id, p.nombre, p.precio, p.imagen_url, p.disponible
FROM productos p
LEFT JOIN producto_categoria pc ON p.id = pc.producto_id
LEFT JOIN categorias c ON pc.categoria_id = c.id
LEFT JOIN producto_ingrediente pi ON p.id = pi.producto_id
WHERE p.disponible = true
  AND p.eliminado_en IS NULL
  AND p.nombre ILIKE %:search%
  AND (c.id = :categoria_id OR :categoria_id IS NULL)
  AND NOT EXISTS (
    SELECT 1 FROM producto_ingrediente pi2
    WHERE pi2.producto_id = p.id
    AND pi2.ingrediente_id IN (:excluded_allergen_ids)
  )
ORDER BY p.nombre ASC
OFFSET :skip LIMIT :limit
```

## Validation Rules

- `page` must be >= 1
- `limit` must be 1-100
- `busqueda` trimmed and escaped for ILIKE
- `categoria` must be valid UUID if provided
- `excluirAlergenos` IDs must be valid UUIDs

## Integration Points

- **Product Creation**: Displays products from `product-creation` capability
- **Ingredient Data**: Uses ingredients from `product-ingredient-association` for allergen filtering
- **Category Data**: Uses categories from `product-category-association` for hierarchical filtering

## Performance Considerations

- Index on `(disponible, eliminado_en)` for fast WHERE clause
- Index on `nombre` for ILIKE search (optional upgrade to full-text search if needed)
- Indexes on M2M foreign keys for JOIN performance
- Pagination prevents large resultsets from straining frontend
