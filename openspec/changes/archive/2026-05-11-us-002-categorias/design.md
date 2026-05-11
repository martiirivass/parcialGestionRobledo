## Context

Food Store needs a hierarchical product categorization system to support its e-commerce catalog. Currently, the backend has authentication (US-001) and the data model skeleton, but no way to organize products. The frontend has UI infrastructure (React, Zustand, Axios) but no category viewing capabilities.

**Current State**:
- Database: PostgreSQL with migrations, seed data, base models
- Backend: FastAPI with JWT auth, role-based access control (ADMIN, STOCK, PEDIDOS, CLIENT)
- Frontend: React + TypeScript with auth store and API client interceptors
- No category model, no hierarchical queries, no category endpoints

**Constraints**:
- Must support arbitrary nesting depth (categories under categories under categories, etc.)
- Public read access (GET), restricted write access (POST/PUT/DELETE for ADMIN/STOCK only)
- Soft delete required; cannot delete categories with active products
- Must prevent cyclic hierarchies (A → B → C → A)

## Goals / Non-Goals

**Goals:**

1. Implement REST API endpoints for category CRUD with proper authorization
2. Support hierarchical category structure with parent-child relationships via self-referencing FK
3. Provide public API to retrieve complete category tree for client navigation
4. Prevent data integrity issues (cycles, orphaned categories with products)
5. Implement soft delete for audit trail preservation
6. Provide frontend hook to fetch and display category hierarchy

**Non-Goals:**

- Category search/full-text indexing (out of scope for MVP)
- Category slug generation or SEO URLs (can be added later)
- Category image/icon support (phase 2)
- Category permissions (everyone in ADMIN/STOCK role has same access)
- Category reordering/sort order (flat ordering, no manual sort)

## Decisions

### 1. Hierarchical Data Structure: Self-Referencing FK vs. Closure Table

**Decision**: Use self-referencing FK (`parentId`) in `Category` table.

**Rationale**:
- **Simpler schema**: One table, one FK (closure table requires extra join table)
- **Query simplicity**: CTE recursive queries (PostgreSQL) handle all hierarchical operations cleanly
- **Performance**: For typical food store (< 1000 categories), CTE is sufficient; indexes on `parentId` prevent N+1
- **Alternative considered**: Closure table (faster for deep trees, but over-engineered for this use case)

**Implementation**:
- Column `parentId` is nullable (NULL = root category)
- Foreign key constraint: `FOREIGN KEY (parentId) REFERENCES categorias(id) ON DELETE RESTRICT`
- Index: `CREATE INDEX idx_categorias_parent_id ON categorias(parentId)`

### 2. Cycle Prevention: CTE Check Before INSERT/UPDATE

**Decision**: Validate hierarchy acyclicity in application layer before persisting.

**Rationale**:
- **DB constraint**: Could use trigger, but application-layer validation is clearer and testable
- **Error messages**: Application can provide specific error ("Category X cannot be child of Y because it would create a cycle")
- **Performance**: Check happens once per write, not on every read

**Implementation**:
```python
async def validate_no_cycles(self, category_id: str, proposed_parent_id: Optional[str]) -> bool:
    """
    Use CTE to check if proposed_parent_id is in the descendants tree of category_id.
    If yes, assigning proposed_parent_id would create a cycle.
    """
    if proposed_parent_id is None:
        return True  # Moving to root is always safe
    
    if category_id == proposed_parent_id:
        return False  # Self-reference not allowed
    
    # CTE query: get all descendants of category_id
    # If proposed_parent_id is in result, it's a cycle
```

### 3. Soft Delete with Integrity Check

**Decision**: Mark deleted categories with `deletedAt` timestamp; prevent deletion if active products exist.

**Rationale**:
- **Audit trail**: Preserves history for analytics and troubleshooting
- **Integrity**: Business rule (RN-CA03) requires no products on deleted categories
- **Query impact**: Public endpoints filter `WHERE deletedAt IS NULL` automatically

**Implementation**:
- Column: `deletedAt TIMESTAMP NULL DEFAULT NULL`
- Before soft delete: Query `ProductoCategoria` to check if any products in this category or its descendants
- If products exist, raise `ConflictError` (HTTP 409)

### 4. API Design: RESTful Endpoints with Proper HTTP Semantics

**Decision**: Follow REST conventions with resource-oriented URLs and correct HTTP methods.

**Endpoints**:
```
Public (no auth required):
  GET /api/v1/categorias                    → List all categories as nested tree

Protected (ADMIN/STOCK only):
  POST /api/v1/categorias                   → Create category
  GET /api/v1/categorias/:id                → Get single category (admin view)
  PUT /api/v1/categorias/:id                → Update category
  DELETE /api/v1/categorias/:id             → Soft delete category
```

**Rationale**:
- **GET** returns tree with nested children: `{ id, nombre, parentId, subcategorias: [...] }`
- **POST** accepts `{ nombre, parentId? }`
- **PUT** accepts `{ nombre?, parentId? }` (both optional for PATCH-like behavior)
- **DELETE** is soft delete (no request body)

### 5. Hierarchical Query: PostgreSQL CTE Recursion

**Decision**: Use `WITH RECURSIVE` for fetching category tree in single query.

**Rationale**:
- **Single query**: Avoids N+1 problem inherent to tree structures
- **Complete tree**: Returns all categories and children in one go
- **Flexible**: Can filter by root category if needed

**Implementation**:
```sql
WITH RECURSIVE categorias_tree AS (
  SELECT id, nombre, parentId, 0 as nivel
  FROM categorias
  WHERE parentId IS NULL AND deletedAt IS NULL
  
  UNION ALL
  
  SELECT c.id, c.nombre, c.parentId, ct.nivel + 1
  FROM categorias c
  JOIN categorias_tree ct ON c.parentId = ct.id
  WHERE c.deletedAt IS NULL
)
SELECT * FROM categorias_tree
ORDER BY parentId, nombre
```

**Frontend Processing**: Recursively build nested structure from flat results.

### 6. Authorization: Dependency-Based Role Check

**Decision**: Extend `require_role` dependency to support list of allowed roles.

**Implementation**:
```python
@router.post("/categorias")
async def create_category(
    cat: CategoryCreate,
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_role(["ADMIN", "STOCK"]))
):
    ...
```

### 7. Response Structure: Flat List vs. Nested Tree

**Decision**: 
- **GET /categorias** (public): Return nested tree structure
- **GET /categorias/:id** (admin): Return single category with flat list of direct children

**Rationale**:
- **Public endpoint**: Nested tree is what clients need for navigation
- **Admin GET**: Flat children simplify pagination/filtering if needed in future

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| **Deep trees slow down CTE queries** | Monitor query performance; add pagination/depth limit if needed. For MVP (< 1000 categories), not a concern. |
| **Forgotten soft delete filters** | Use SQLModel base repository that auto-filters `WHERE deletedAt IS NULL` in list/get methods. Admin view requires explicit `include_deleted=true`. |
| **Accidental self-reference** | Validate `parentId != id` in application layer before INSERT/UPDATE. |
| **Product re-assignment on category delete** | Currently rejected (HTTP 409). Future feature: cascade delete products or re-assign them. |
| **Frontend tree rendering complexity** | Use recursive component with memoization. Keep tree shallow (< 5 levels) in practice. |
| **Concurrent category creation with same name** | Add unique constraint: `UNIQUE (parentId, nombre)`. Handles duplicates in same parent. |

## Migration Plan

### Database Migration (Alembic)

1. Create `categorias` table with self-referencing FK
2. Create indexes on `parentId` and `nombre`
3. Seed with sample data (if needed for testing)

### Backend Implementation Order

1. Create `Category` SQLModel
2. Create `CategoryRepository` with CTE query methods
3. Create `CategoryService` with cycle validation logic
4. Create `CategoryRouter` with endpoints
5. Extend `require_role` dependency (if not already generic)
6. Write unit tests for cycle detection
7. Write integration tests for all CRUD operations

### Frontend Implementation Order

1. Create `useCategories` hook to fetch tree from `GET /api/v1/categorias`
2. Create `CategoryTree` component (recursive)
3. Integrate into homepage/navigation

### Deployment

1. Run Alembic migration on production database
2. Deploy backend code with new endpoints
3. Deploy frontend code with category components
4. Smoke tests: create/update/delete categories, verify tree rendering

### Rollback

1. If category endpoints cause issues: disable them (comment out router)
2. Database: `alembic downgrade -1` removes table (safe if no products yet)
3. Frontend: remove category components from pages (fallback to flat list if needed)

## Open Questions

1. **Category icons/images**: Should we support in MVP or defer to phase 2?
   - **Answer**: Defer to phase 2 (keep simple for MVP)
2. **Category slug vs. ID**: Should public-facing URLs use `/categorias/fresh-produce` or `/categorias/123`?
   - **Answer**: Use IDs only for now (slugs require additional validation)
3. **Max nesting depth**: Should we impose a limit to prevent abuse?
   - **Answer**: No limit for MVP (trust data entry); can add in future if needed
4. **Bulk category operations**: Create/update multiple in one request?
   - **Answer**: Not in scope for MVP; implement one-by-one
5. **Category analytics**: Track views/clicks?
   - **Answer**: Out of scope (phase 2 feature)
