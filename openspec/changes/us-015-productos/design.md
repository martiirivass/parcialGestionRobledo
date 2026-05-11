## Context

Food Store has completed foundational infrastructure (US-000: database setup, US-001: authentication, US-002: categories) and is now ready to implement its core business capability: product management. 

**Current State**:
- Database: PostgreSQL with migrations scaffold, `Usuario`, `Rol`, `UsuarioRol`, `RefreshToken` tables created
- Backend: FastAPI with JWT auth, role-based access control (ADMIN, STOCK, PEDIDOS, CLIENT roles)
- Frontend: React + TypeScript with auth store, Zustand state management, Axios API client with interceptors
- Categories implemented: Hierarchical category system with soft delete and cycle prevention
- Ingredients registered: `Ingrediente` table with allergen flags (US-011 prerequisite already available)
- No products yet: Product table, M2M relationships, CRUD endpoints, or product-related queries

**Constraints**:
- Product prices must use NUMERIC precision (never float) to avoid monetary rounding errors
- Stock must be non-negative integer; decrements must be atomic and transactional
- Products can belong to multiple categories and have multiple ingredients (M2M relationships)
- Soft delete required to preserve historical product data for order snapshots
- Public catalog endpoints must not expose internal pricing or stock details to non-admin users
- All STOCK/ADMIN endpoints must check role authorization before allowing modifications

**Stakeholders**:
- Gestor de Stock: Creates, updates, deletes products; manages stock levels
- Cliente: Browses public catalog, views product details including ingredients/allergens
- Admin: Full access to all product operations plus visibility into all products (including soft-deleted)

## Goals / Non-Goals

**Goals:**

1. **Implement complete product CRUD system** with proper authorization (ADMIN/STOCK for writes, public for reads)
2. **Support M2M associations** between products and categories, and products and ingredients
3. **Provide flexible public catalog browsing** with pagination, category filtering, search, and allergen filtering
4. **Maintain data integrity** with atomic transactions, stock validation, and soft delete
5. **Ensure price precision** using NUMERIC data type to avoid floating-point errors
6. **Enable product personalization** by exposing ingredient information for future "customize" features
7. **Expose product inventory** for cart and order validation without revealing exact quantities

**Non-Goals:**

- Full-text search indexing (out of scope for MVP; basic ILIKE search sufficient)
- Product recommendations or AI-driven discovery
- Bulk import/export of products (CSV upload, etc.)
- Multi-warehouse inventory tracking
- Image upload to cloud storage (URL input only; use local storage or S3 separately)
- Product variants (sizes, colors, etc.) – all products are single-sku for now
- Price history or change tracking

## Decisions

### 1. **M2M Relationships via Pivot Tables** (ProductoCategoria, ProductoIngrediente)

**Decision**: Use explicit pivot tables (`ProductoCategoria`, `ProductoIngrediente`) instead of JSON arrays or implicit relationships.

**Rationale**: 
- Normalization enables efficient queries (JOIN on indexes)
- Supports adding metadata to relationships in the future (e.g., "primary category", "preparation instructions for ingredient")
- Matches existing patterns in the codebase (e.g., UsuarioRol)

**Alternatives Considered**:
- JSON arrays in PostgreSQL: More compact, but makes filtering/querying harder and loses data integrity constraints
- Implicit relationships (no pivot table): Simpler but doesn't support N-to-N; requires denormalization

### 2. **Soft Delete for Products** (eliminado_en timestamp)

**Decision**: Implement soft delete by setting `eliminado_en = NOW()` instead of physical deletion; exclude soft-deleted rows from public queries by default.

**Rationale**:
- Preserves referential integrity for historical orders (product snapshots remain valid)
- Audit trail: can track when products were removed
- Reversible: admin can "restore" products if needed
- Matches existing pattern (Categories, Ingredientes already use soft delete)

**Alternatives Considered**:
- Hard delete: Simpler but breaks order history if a product is removed before orders are archived
- Status enum (ACTIVE, INACTIVE, ARCHIVED): More complex; soft delete is sufficient for MVP

### 3. **Stock Management: Atomic Integer Decrements with SELECT FOR UPDATE**

**Decision**: Use PostgreSQL `SELECT FOR UPDATE` when updating stock in order creation to prevent race conditions. Validate stock BEFORE decrementing as part of a single transaction.

**Rationale**:
- Prevents overselling: two simultaneous orders can't both see sufficient stock and both succeed
- Atomic transacti

on ensures consistency: if one product fails, entire order fails (Unit of Work pattern)
- Standard pattern for inventory management

**Alternatives Considered**:
- Optimistic locking (version fields): More complex; pessimistic locking simpler for this use case
- Redis cache for stock: Adds complexity; synchronization issues; PostgreSQL sufficient for MVP volume

### 4. **Price Storage as NUMERIC(10,2)**

**Decision**: Store product prices as `NUMERIC(10,2)` (fixed-point decimal) to ensure accurate monetary calculations.

**Rationale**:
- Avoids floating-point rounding errors (e.g., 0.1 + 0.2 != 0.3 in IEEE 754)
- Standard for financial systems
- PostgreSQL NUMERIC provides arbitrary precision

**Alternatives Considered**:
- Integer (store cents): Works but requires conversion on every display; less intuitive
- Float/Double: Causes rounding errors; unacceptable for payments

### 5. **Public Catalog Endpoints Don't Expose Exact Stock**

**Decision**: Return `disponible` (boolean: true if stock > 0) instead of actual quantity to non-admin users.

**Rationale**:
- Prevents abuse (competitors checking inventory levels frequently)
- Simplifies UI (shows "in stock" vs "out of stock", not "5 units left")
- Admin can see exact stock via separate admin endpoints

**Alternatives Considered**:
- Show exact stock to all users: Security risk; encourages competitor scraping
- Show stock in cart only: Inconsistent UX; customers want to know before checkout

### 6. **Product Detail Endpoint Joins Categories and Ingredients**

**Decision**: Product detail (`GET /api/v1/productos/:id`) returns full object with nested `categorias[]` and `ingredientes[]` arrays.

**Rationale**:
- Enables "show allergies" UI without additional requests
- Single request for full product context improves frontend UX
- JOIN queries are efficient with proper indexes

**Alternatives Considered**:
- Separate endpoints for categories/ingredients: More API calls; adds latency
- Include in list endpoint: Too much data per product; bloats paginated responses

### 7. **ProductService Handles Validation; Repository Handles Data Access**

**Decision**: Separate concerns:
- **ProductService** (business logic): Price validation (> 0, 2 decimals), stock validation (>= 0), category/ingredient existence checks, soft delete logic
- **ProductRepository** (data access): SQL queries, M2M associations, filtering, pagination

**Rationale**:
- Single Responsibility Principle: easy to test each layer independently
- Matches existing backend architecture (used successfully in categories)
- Enables reuse of validation logic across endpoints

**Alternatives Considered**:
- All logic in router endpoints: Leads to code duplication; hard to test
- All logic in repository: Mixes data access with business rules; ORM anti-pattern

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| **Race condition: Two orders subtract stock simultaneously for same product** | Use `SELECT FOR UPDATE` in transactions; validate stock atomically within UoW; test with concurrent load tests |
| **Soft delete queries become complex (must filter `eliminado_en IS NULL` everywhere)** | Create base queries in repository; always use filtered versions for public endpoints; document in code |
| **Floating-point price errors if frontend uses JSON numbers** | Use Pydantic's `Decimal` type; frontend receives strings or integers (cents); document API contract |
| **M2M tables could become large if products have many categories/ingredients** | Add indexes on foreign keys; pagination in list endpoints; acceptable for MVP scale |
| **Product deletion cascades: what if admin soft-deletes a product with active orders?** | Snapshot design handles this (orders store price_snapshot, not live product link); soft delete is safe |
| **Stock exhaustion: product becomes unavailable mid-checkout** | Accept this as normal e-commerce flow; order creation validates stock before persisting; customer sees "out of stock" after submission |

## Migration Plan

### Phase 1: Database Setup (Alembic Migration)
1. Create migration: `alembic revision --autogenerate -m "Add Producto table and M2M relations"`
2. Tables: `productos`, `producto_categoria`, `producto_ingrediente`
3. Indexes: `idx_productos_disponible_eliminado`, `idx_producto_categoria_ids`, `idx_producto_ingrediente_ids`
4. Run: `alembic upgrade head` in local dev environment
5. Test: `alembic downgrade -1` then `alembic upgrade head` (reversibility)

### Phase 2: Backend Implementation
1. Create `ProductModel` SQLModel in `backend/app/models/product.py`
2. Create `ProductRepository` in `backend/app/repositories/product_repository.py` with queries:
   - `get_all_public()` – paginated, filtered, excludes soft-deleted
   - `get_by_id_public(id)` – single product, public safe
   - `get_by_id_admin(id, include_deleted=False)` – admin view
   - `create(data, uow)` – atomic insert with category/ingredient associations
   - `update(id, data, uow)` – atomic update
   - `soft_delete(id, uow)` – set eliminado_en
3. Create `ProductService` in `backend/app/productos/service.py` with business logic
4. Create Pydantic schemas in `backend/app/productos/schemas.py` (Request/Response)
5. Create router in `backend/app/productos/router.py` with endpoints
6. Register router in `backend/app/main.py`
7. Add authorization checks using `require_role` decorator

### Phase 3: Frontend Implementation
1. Create `useProducts()` hook in `frontend/src/features/products/hooks/`
2. Create API client in `frontend/src/features/products/api.ts`
3. Create `ProductCard` component for list views
4. Create `ProductDetailPage` component
5. Create `ProductGrid` with pagination/filtering
6. Update `HomePage` to integrate ProductGrid

### Phase 4: Testing & Validation
1. Backend unit tests: validation logic, soft delete behavior
2. Backend integration tests: CRUD endpoints, authorization, M2M associations
3. Frontend component tests: rendering, loading/error states
4. End-to-end: Create product in admin, verify appears in public catalog

### Rollback Strategy
- If critical issues detected: `alembic downgrade -1` to remove tables (destructive; only for dev)
- For production: Keep soft-deleted row; disable writes via feature flag; revert code to previous version

## Open Questions

1. **Product image storage**: Should we implement URL-only for MVP, or add S3/local upload? → **Decision**: URL-only for MVP (store as string in database; actual upload handled separately)
2. **Stock alerting**: Should we notify admin when stock falls below threshold? → **Out of scope for MVP; future admin feature**
3. **Product variants**: Do we need sizes or quantities in the future? → **Assume single-sku for MVP; architecture supports future M2M expansion**
4. **Filtering performance**: With 10K+ products and multiple category filters, do we need full-text search? → **Test with basic ILIKE; upgrade to PostgreSQL full-text if needed**

## Conclusion

This design establishes a normalized, transactionally-safe product management system that leverages the existing auth and category infrastructure. The separation of concerns (Service/Repository layers) enables parallel frontend development. Soft delete and snapshot strategies ensure data integrity for future order history. Stock atomicity prevents race conditions critical to e-commerce reliability.
