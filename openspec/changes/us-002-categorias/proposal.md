## Why

The Food Store e-commerce platform requires a flexible, hierarchical category system to organize its food product catalog. Currently, the system has no way to classify products or allow customers to browse by category. Implementing a hierarchical category structure (with support for parent-child relationships) enables intuitive navigation, better user experience, and enables the foundation for future product management features. This is a critical foundational capability for US-003 (Products).

## What Changes

- **New**: Category CRUD endpoints for admin/stock users (create, read, update, delete)
- **New**: Hierarchical category structure with arbitrary nesting depth via self-referencing FK
- **New**: Public category listing endpoint that returns categories as a nested tree structure
- **New**: Validation to prevent category cycles (A → B → A) and self-referencing
- **New**: Soft delete support for categories with integrity constraints (cannot delete if active products exist)
- **New**: Category filtering support for future product listing queries
- **Modified**: Authorization system to support STOCK role access to category endpoints

## Capabilities

### New Capabilities

- `category-management`: Full CRUD operations for product categories with hierarchical support (create, read, update, delete), parent-child relationships, cycle prevention, and soft delete with integrity constraints
- `category-browsing`: Public endpoint to retrieve complete category hierarchy as a nested tree structure for client-side navigation

### Modified Capabilities

- `authentication-rbac`: Extend existing RBAC system to include STOCK role authorization checks for category endpoints (POST, PUT, DELETE restricted to ADMIN/STOCK roles)

## Impact

**Backend**:
- New model: `Category` with self-referencing FK (`parentId`)
- New service: `CategoryService` with hierarchical query logic (CTE recursion)
- New repository: `CategoryRepository` with specialized queries
- New router: `/api/v1/categorias` endpoints
- New database migration for Category table

**Frontend**:
- New hook: `useCategories()` to fetch and cache hierarchy
- New component: `CategoryTree` for hierarchical rendering
- Integration with existing `apiClient` via interceptors

**Database**:
- New table: `categorias` with columns: `id`, `nombre`, `padre_id` (FK self-ref), `eliminado_en`, `creado_en`, `actualizado_en`
- Constraints: UNIQUE name per parent, prevent cycles, prevent self-reference
- Indexes on `padre_id` for efficient hierarchical queries

**Authorization**:
- POST/PUT/DELETE `/api/v1/categorias` require ADMIN or STOCK role
- GET `/api/v1/categorias` is public (no auth required)

**Testing**:
- Unit tests for cycle detection logic
- Integration tests for CRUD operations
- E2E tests for authorization and hierarchy rendering
