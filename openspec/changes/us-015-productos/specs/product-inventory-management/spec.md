# Specification: Product Inventory Management

**Capability**: `product-inventory-management`  
**Version**: 1.0  
**Status**: NEW  
**Last Updated**: 2026-05-11

## Overview

Atomic operations to update product stock levels while preventing negative inventory. Used for manual stock adjustments by STOCK/ADMIN users and automatic decrements during order creation.

## API Contract

### UPDATE Stock – `PATCH /api/v1/productos/:id/stock`

**Authentication**: Required (JWT)  
**Authorization**: ADMIN, STOCK roles only  
**Request Body**:
```json
{
  "cantidad": "integer (can be positive or negative)"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "nombre": "string",
  "stock": "integer",
  "disponible": "boolean",
  "actualizado_en": "ISO 8601 timestamp"
}
```

**Behavior**:
- Increments stock by `cantidad` (can be negative to decrement)
- Final stock must be >= 0 (rejects if it would go negative)
- Atomic operation: validates stock BEFORE updating (uses SELECT FOR UPDATE in transaction)
- Updates `actualizado_en` timestamp

**Error Responses**:
- `400 Bad Request`: Resulting stock would be negative or `cantidad = 0`
- `401 Unauthorized`: No valid JWT token
- `403 Forbidden`: User lacks ADMIN/STOCK role
- `404 Not Found`: Product doesn't exist
- `409 Conflict`: Concurrent update conflict (if optimistic locking used in future)

## Validation Rules

- `cantidad` must not be 0
- Final stock = current_stock + cantidad must be >= 0
- Only ADMIN/STOCK roles can modify stock

## Transaction Guarantees

**Atomicity**: 
- SELECT current_stock WITH LOCK
- Validate: current_stock + cantidad >= 0
- UPDATE stock = stock + cantidad
- Commit or rollback as single transaction

**Prevents Race Conditions**: 
Using `SELECT FOR UPDATE` ensures two simultaneous requests cannot both succeed if combined quantity would exceed available stock.

## Integration Points

- Used internally by order creation (automatic stock decrements)
- Used by admin/stock interfaces for manual inventory adjustments
- Integrates with Product model (same table)

## Future Considerations

- Stock history tracking (audit log of changes)
- Stock reorder points and auto-alerts
- Multi-warehouse inventory allocation
