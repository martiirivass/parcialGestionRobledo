# Specification: Product Creation

**Capability**: `product-creation`  
**Version**: 1.0  
**Status**: NEW  
**Last Updated**: 2026-05-11

## Overview

The `product-creation` capability enables authorized users (ADMIN, STOCK roles) to create, read, update, and delete products in the catalog. This includes full CRUD operations with role-based authorization, price validation, stock management, and soft delete support.

## Data Model

### Product Entity

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | UUID | PK, NOT NULL | Auto-generated |
| `nombre` | VARCHAR(255) | NOT NULL, max_length=255 | Product name |
| `descripcion` | TEXT | Nullable | Detailed description |
| `precio` | NUMERIC(10,2) | NOT NULL, > 0 | Fixed-point decimal price |
| `stock` | INTEGER | NOT NULL, >= 0 | Inventory quantity |
| `imagen_url` | VARCHAR(500) | Nullable | External image URL |
| `disponible` | BOOLEAN | NOT NULL, default=true | Availability flag |
| `eliminado_en` | TIMESTAMP | Nullable | Soft delete timestamp |
| `creado_en` | TIMESTAMP | NOT NULL, default=NOW() | Creation timestamp |
| `actualizado_en` | TIMESTAMP | NOT NULL, default=NOW() | Last update timestamp |

**Indexes**:
- `idx_productos_disponible_eliminado` on `(disponible, eliminado_en DESC)` for public catalog queries
- `idx_productos_nombre` on `nombre` (ILIKE) for search

### Associations

Products have M2M relationships managed via pivot tables:

- **ProductoCategoria** table: `(producto_id, categoria_id)` – product belongs to categories
- **ProductoIngrediente** table: `(producto_id, ingrediente_id)` – product contains ingredients

## API Contracts

### CREATE Product – `POST /api/v1/productos`

**Authentication**: Required (JWT)  
**Authorization**: ADMIN, STOCK roles only  
**Request Body**:
```json
{
  "nombre": "string (required, 3-255 chars)",
  "descripcion": "string (optional)",
  "precio": "decimal (required, > 0, max 2 decimals)",
  "stock": "integer (required, >= 0)",
  "imagen_url": "string (optional, max 500 chars)",
  "disponible": "boolean (optional, default true)"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "nombre": "string",
  "descripcion": "string | null",
  "precio": "decimal string",
  "stock": "integer",
  "imagen_url": "string | null",
  "disponible": "boolean",
  "creado_en": "ISO 8601 timestamp",
  "actualizado_en": "ISO 8601 timestamp"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid data (precio <= 0, stock < 0, nombre empty, invalid URL)
- `401 Unauthorized`: No valid JWT token
- `403 Forbidden`: User lacks ADMIN/STOCK role

### READ Product – `GET /api/v1/productos/:id`

**Authentication**: Not required  
**Authorization**: Public (but soft-deleted products return 404)  
**Response** (200 OK):
```json
{
  "id": "uuid",
  "nombre": "string",
  "descripcion": "string | null",
  "precio": "decimal string",
  "imagen_url": "string | null",
  "disponible": "boolean",
  "categorias": [
    {"id": "uuid", "nombre": "string"}
  ],
  "ingredientes": [
    {"id": "uuid", "nombre": "string", "es_alergeno": "boolean"}
  ],
  "creado_en": "ISO 8601 timestamp"
}
```

**Note**: Public responses do NOT include exact `stock` value (only `disponible` boolean).

**Error Responses**:
- `404 Not Found`: Product doesn't exist or is soft-deleted

### UPDATE Product – `PUT /api/v1/productos/:id`

**Authentication**: Required (JWT)  
**Authorization**: ADMIN, STOCK roles only  
**Request Body**: (all fields optional)
```json
{
  "nombre": "string",
  "descripcion": "string",
  "precio": "decimal",
  "stock": "integer",
  "imagen_url": "string",
  "disponible": "boolean"
}
```

**Response** (200 OK): Updated product object (same schema as CREATE response)

**Error Responses**:
- `400 Bad Request`: Invalid data
- `401 Unauthorized`: No valid JWT token
- `403 Forbidden`: User lacks ADMIN/STOCK role
- `404 Not Found`: Product doesn't exist

### DELETE Product (Soft Delete) – `DELETE /api/v1/productos/:id`

**Authentication**: Required (JWT)  
**Authorization**: ADMIN, STOCK roles only  
**Response** (204 No Content)

**Behavior**: Sets `eliminado_en = NOW()`. Product no longer appears in public catalog but remains in database for audit and order history.

**Error Responses**:
- `401 Unauthorized`: No valid JWT token
- `403 Forbidden`: User lacks ADMIN/STOCK role
- `404 Not Found`: Product doesn't exist

## Validation Rules

1. **Price Validation**:
   - Must be > 0
   - Must have at most 2 decimal places
   - Stored as NUMERIC(10,2) to prevent floating-point errors

2. **Stock Validation**:
   - Must be >= 0 (non-negative integer)
   - Cannot be null

3. **Name Validation**:
   - 3-255 characters required
   - Trimmed of whitespace

4. **Image URL Validation**:
   - Optional; if provided, must be valid URL (http:// or https://)
   - Max 500 characters

## Business Rules

- **Availability**: Product is "disponible" if `disponible = true` AND `stock > 0` AND `eliminado_en IS NULL`
- **Soft Delete**: Deleted products are excluded from public queries by default. Admin can include with `?includeDeleted=true` query parameter.
- **Immutability for Orders**: Product snapshots store price/details at order time; changes to products don't affect historical orders.
- **Role-Based Access**:
  - ADMIN: Full CRUD on all products
  - STOCK: Full CRUD on products; cannot see ADMIN-only features
  - CLIENT: Read-only on public products
  - PEDIDOS: Read-only on products for order context

## Integration Points

- **ProductoCategoria**: Used by `product-category-association` capability
- **ProductoIngrediente**: Used by `product-ingredient-association` capability
- **Stock decrements**: Used by order creation (requires atomic transaction via Unit of Work)
- **Category deletion**: Must check `check_has_products()` before deleting a category

## Future Considerations

- Bulk import/export (CSV)
- Product variants (sizes, colors, flavors)
- Price history tracking
- AI-based recommendations
- Product reviews and ratings
