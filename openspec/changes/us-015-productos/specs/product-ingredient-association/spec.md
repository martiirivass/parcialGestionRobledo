# Specification: Product-Ingredient Association

**Capability**: `product-ingredient-association`  
**Version**: 1.0  
**Status**: NEW  
**Last Updated**: 2026-05-11

## Overview

Many-to-many (M2M) relationships between products and ingredients. Enables products to list their composition, highlight allergens, and support allergen-based filtering in the catalog.

## Data Model

### ProductoIngrediente Table

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `producto_id` | UUID | PK, FK → productos(id), NOT NULL | Product reference |
| `ingrediente_id` | UUID | PK, FK → ingredientes(id), NOT NULL | Ingredient reference |

**Constraints**:
- PRIMARY KEY (producto_id, ingrediente_id)
- UNIQUE (producto_id, ingrediente_id) to prevent duplicates
- Foreign keys with ON DELETE CASCADE

**Indexes**:
- idx_producto_ingrediente_pid on producto_id
- idx_producto_ingrediente_iid on ingrediente_id

## API Contracts

### ASSIGN Ingredients to Product – `PUT /api/v1/productos/:id/ingredientes`

**Authentication**: Required (JWT)  
**Authorization**: ADMIN, STOCK roles only  
**Request Body**:
```json
{
  "ingrediente_ids": ["uuid", "uuid", ...]
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "nombre": "string",
  "ingredientes": [
    {
      "id": "uuid",
      "nombre": "string",
      "es_alergeno": "boolean"
    }
  ]
}
```

**Behavior**:
- Replaces all existing ingredient associations for the product
- Empty array removes all ingredients
- Each ingrediente_id must exist and not be soft-deleted

**Error Responses**:
- `400 Bad Request`: Invalid ingredient UUID or ingredient doesn't exist
- `401 Unauthorized`: No valid JWT token
- `403 Forbidden`: User lacks ADMIN/STOCK role
- `404 Not Found`: Product doesn't exist

## Business Rules

- A product can contain 0 or more ingredients
- An ingredient can be in 0 or more products
- Ingredients marked `es_alergeno = true` are highlighted in product details
- Customers can filter products to exclude specific allergen ingredients

## Public API - Product Detail with Ingredients

**GET /api/v1/productos/:id** includes:
```json
{
  "ingredientes": [
    {
      "id": "uuid",
      "nombre": "string",
      "es_alergeno": "boolean"
    }
  ]
}
```

**Frontend renders**: Allergen ingredients in red/bold/icon; non-allergen ingredients normal

## Query Examples

**Get products containing specific allergen**:
```sql
SELECT DISTINCT p.*
FROM productos p
JOIN producto_ingrediente pi ON p.id = pi.producto_id
JOIN ingredientes i ON pi.ingrediente_id = i.id
WHERE i.id = :ingredient_id AND i.es_alergeno = true
AND p.disponible = true
AND p.eliminado_en IS NULL
```

**Get products WITHOUT specific allergen (exclusion filter)**:
```sql
SELECT p.*
FROM productos p
WHERE p.disponible = true
AND p.eliminado_en IS NULL
AND NOT EXISTS (
  SELECT 1 FROM producto_ingrediente pi
  JOIN ingredientes i ON pi.ingrediente_id = i.id
  WHERE pi.producto_id = p.id
  AND i.id IN (:excluded_ingredient_ids)
)
```

## Integration Points

- Used by `product-creation` to build product composition
- Used by `product-catalog-browsing` for allergen filtering
- Used by product detail pages to show composition and allergens
- Integrated with frontend for highlighting allergens in UI

## Future Considerations

- Ingredient preparation instructions (e.g., "gluten-free option")
- Nutritional information per ingredient
- Substitution recommendations ("contains peanuts; try tree nuts instead")
