## Phase 1: Database Schema and Migrations

- [x] 1.1 Create Alembic migration file: `alembic revision --autogenerate -m "Add Producto table and M2M relations"`
  - Tables: `productos`, `producto_categoria`, `producto_ingrediente`
  - Columns as specified in design.md and specs
  - Foreign keys with ON DELETE CASCADE for M2M tables
  - Constraints: NOT NULL, UNIQUE, CHECK (precio > 0, stock >= 0)
  - Indexes: idx_productos_disponible_eliminado, idx_productos_nombre, idx_producto_categoria_*, idx_producto_ingrediente_*

- [x] 1.2 Verify migration file is syntactically correct: `alembic upgrade head` (test in local DB)

- [x] 1.3 Verify migration is reversible: `alembic downgrade -1` then `alembic upgrade head` (test rollback scenario)

- [x] 1.4 Add migration to git: `git add backend/migrations/versions/`

## Phase 2: Backend SQLModel and Repository Layer

- [x] 2.1 Create `backend/app/models/product.py` with SQLModel `Producto` class
  - Fields: id, nombre, descripcion, precio (Decimal), stock, imagen_url, disponible, eliminado_en, creado_en, actualizado_en
  - Relationships: `categorias` (M2M via ProductoCategoria), `ingredientes` (M2M via ProductoIngrediente)
  - Default values: disponible=True, creado_en/actualizado_en=datetime.utcnow
  - Use SQLAlchemy Column with NUMERIC precision for price: `Column(NUMERIC(10, 2))`

- [x] 2.2 Create `backend/app/models/producto_categoria.py` with SQLModel `ProductoCategoria`
  - Fields: producto_id (FK), categoria_id (FK)
  - Composite primary key

- [x] 2.3 Create `backend/app/models/producto_ingrediente.py` with SQLModel `ProductoIngrediente`
  - Fields: producto_id (FK), ingrediente_id (FK)
  - Composite primary key

- [x] 2.4 Create `backend/app/repositories/product_repository.py` with `ProductRepository` class
  - Inherit from `BaseRepository[Producto]`
  - Implement `get_all_public(skip, limit, categoria_id=None, search=None, excluir_alergenos=None)` → List[Producto]
    - Returns only available products (disponible=true, stock>0, eliminado_en IS NULL)
    - Supports category filtering (includes subcategories)
    - Supports ILIKE search on nombre
    - Supports allergen exclusion via NOT EXISTS query
    - Uses pagination (offset, limit)
  - Implement `get_by_id_public(id)` → Producto
    - Loads categorias and ingredientes relationships
    - Returns None if not found or soft-deleted
  - Implement `get_by_id_admin(id, include_deleted=False)` → Producto
    - Admin view; can include soft-deleted products if flag set
    - Loads all relationships
  - Implement `create(producto_data, categorias_ids=None, ingredientes_ids=None, uow)` → Producto
    - Atomically creates product and associates categories/ingredients
    - Validates that all categoria_ids and ingrediente_ids exist
  - Implement `update(id, producto_data, categorias_ids=None, ingredientes_ids=None, uow)` → Producto
    - Atomically updates product and M2M associations
  - Implement `soft_delete(id, uow)` → bool
    - Sets eliminado_en = now()
  - Implement `update_stock(id, cantidad, uow)` → Producto
    - Uses SELECT FOR UPDATE to prevent race conditions
    - Validates resulting stock >= 0
    - Increments actualizado_en

- [x] 2.5 Create `backend/app/models/__init__.py` and add Producto imports to ensure models are registered

- [x] 2.6 Add `ProductRepository` to `UnitOfWork` class as attribute `self.productos`

- [x] 2.7 Run `pytest backend/tests/test_models.py` to verify models load correctly (no ORM errors)

## Phase 3: Backend Service Layer

- [x] 3.1 Create `backend/app/productos/service.py` with `ProductService` class
  - Implement `create_product(nombre, descripcion, precio, stock, imagen_url, disponible, categorias_ids, ingredientes_ids, uow)` → Producto
    - Validate: precio > 0, stock >= 0, nombre 3-255 chars, imagen_url valid if provided
    - Check all categoria_ids exist and not soft-deleted
    - Check all ingrediente_ids exist and not soft-deleted
    - Create product via repository
    - Return created product
  - Implement `get_product(id, admin=False, include_deleted=False, uow)` → Producto
    - Use appropriate repository method based on admin flag
    - Raise ProductNotFound if not found
  - Implement `list_products_public(skip, limit, categoria_id, search, excluir_alergenos, uow)` → (List[Producto], total_count)
    - Call repository method
    - Return data + total count for pagination
  - Implement `update_product(id, update_data, categorias_ids=None, ingredientes_ids=None, uow)` → Producto
    - Validate updated fields (if provided)
    - Check product exists first
    - Call repository update
    - Return updated product
  - Implement `delete_product(id, uow)` → bool
    - Check product exists first
    - Call repository soft_delete
    - Return True on success
  - Implement `update_stock(id, cantidad, uow)` → Producto
    - Validate cantidad != 0
    - Get current stock
    - Validate (current_stock + cantidad) >= 0
    - Call repository update_stock
    - Return updated product

- [x] 3.2 Create `backend/app/productos/schemas.py` with Pydantic request/response models
  - `ProductBase`: nombre, descripcion, precio, stock, imagen_url, disponible (all optional for Update)
  - `ProductCreate`: extends ProductBase, adds categorias_ids, ingredientes_ids (lists of UUIDs)
  - `ProductUpdate`: all fields optional
  - `ProductResponse`: includes id, creado_en, actualizado_en, categorias (list with id/nombre), ingredientes (list with id/nombre/es_alergeno)
  - `ProductPublicResponse`: same as ProductResponse but excludes exact stock (only disponible boolean)
  - Add validators: @field_validator for precio > 0, stock >= 0, nombre length, etc.

- [x] 3.3 Write unit tests in `backend/tests/test_productos_service.py`
  - Test create_product with valid data → returns Producto
  - Test create_product with invalid price (price <= 0) → raises ValueError
  - Test create_product with invalid stock (stock < 0) → raises ValueError
  - Test create_product with invalid nombre (< 3 chars) → raises ValueError
  - Test update_stock with valid cantidad → stock updates correctly
  - Test update_stock would go negative → raises ValueError
  - Test soft_delete → sets eliminado_en
  - Test get_product includes relationships (categorias, ingredientes)

- [x] 3.4 Run tests: `pytest backend/tests/test_productos_service.py -v`

## Phase 4: Backend API Router

- [x] 4.1 Create `backend/app/productos/router.py` with FastAPI router
  - `POST /api/v1/productos` → create_product
    - Request: ProductCreate schema
    - Response: 201 with ProductResponse
    - Authorization: require_role(['ADMIN', 'STOCK'])
    - Error handling: 400 (validation), 401 (auth), 403 (role), 409 (duplicate name if unique constraint)
  - `GET /api/v1/productos/:id` → get_product (public)
    - Request: path param id
    - Response: 200 with ProductPublicResponse (no exact stock)
    - Error: 404 if not found or soft-deleted
  - `GET /api/v1/productos` → list_products (public)
    - Query params: page, limit, categoria_id, busqueda, excluirAlergenos
    - Response: 200 with {data: [], pagination: {page, limit, total, totalPages}}
    - No auth required
  - `PUT /api/v1/productos/:id` → update_product
    - Request: ProductUpdate schema
    - Response: 200 with ProductResponse
    - Authorization: require_role(['ADMIN', 'STOCK'])
    - Error: 400, 403, 404
  - `DELETE /api/v1/productos/:id` → delete_product (soft delete)
    - Response: 204 No Content
    - Authorization: require_role(['ADMIN', 'STOCK'])
    - Error: 403, 404
  - `PATCH /api/v1/productos/:id/stock` → update_stock
    - Request: {cantidad: integer}
    - Response: 200 with {id, nombre, stock, disponible, actualizado_en}
    - Authorization: require_role(['ADMIN', 'STOCK'])
    - Error: 400 (negative result), 403, 404
  - `PUT /api/v1/productos/:id/categorias` → assign_categories
    - Request: {categoria_ids: [uuid, ...]}
    - Response: 200 with {id, nombre, categorias: []}
    - Authorization: require_role(['ADMIN', 'STOCK'])
    - Error: 400 (invalid categoria IDs), 403, 404
  - `PUT /api/v1/productos/:id/ingredientes` → assign_ingredients
    - Request: {ingrediente_ids: [uuid, ...]}
    - Response: 200 with {id, nombre, ingredientes: []}
    - Authorization: require_role(['ADMIN', 'STOCK'])
    - Error: 400 (invalid ingrediente IDs), 403, 404

- [x] 4.2 Register router in `backend/app/main.py`: `app.include_router(productos_router, prefix="/api/v1", tags=["productos"])`

- [x] 4.3 Write integration tests in `backend/tests/test_productos_router.py`
  - Test POST /productos with valid data → 201
  - Test POST /productos with invalid price → 400
  - Test POST /productos with invalid stock → 400
  - Test POST /productos as CLIENT role → 403
  - Test GET /productos (public) → 200 with pagination
  - Test GET /productos with categoria filter → returns filtered products
  - Test GET /productos with search → ILIKE search works
  - Test GET /productos with excluirAlergenos → filters by allergen
  - Test GET /productos/:id (public) → returns ProductPublicResponse (no exact stock)
  - Test GET /productos/:id for soft-deleted product → 404
  - Test PUT /productos/:id with valid updates → 200
  - Test PUT /productos/:id as CLIENT role → 403
  - Test DELETE /productos/:id → 204
  - Test PATCH /productos/:id/stock with valid cantidad → 200 updates stock
  - Test PATCH /productos/:id/stock would go negative → 400
  - Test PUT /productos/:id/categorias with valid IDs → 200
  - Test PUT /productos/:id/categorias with invalid category → 400
  - Test PUT /productos/:id/ingredientes with valid IDs → 200
  - Test authorization middleware blocks unauthenticated requests to protected endpoints → 401

- [x] 4.4 Run integration tests: `pytest backend/tests/test_productos_router.py -v`

- [x] 4.5 Verify Swagger/OpenAPI docs: `http://localhost:8000/docs` shows all producto endpoints

## Phase 5: Backend Linting and Type Checking

- [x] 5.1 Run pylint: `pylint backend/app/productos/` → resolve warnings

- [x] 5.2 Run mypy: `mypy backend/app/productos/ --strict` → resolve type errors

- [x] 5.3 Add docstrings to all public methods
  - ProductService methods: describe params, return types, raises exceptions
  - ProductRepository methods: describe SQL behavior, indexes used
  - Router endpoints: OpenAPI-friendly docstrings with examples

## Phase 6: Frontend State Management and API Client

- [ ] 6.1 Create `frontend/src/features/products/types.ts`
  - `type Product = {id, nombre, descripcion, precio, stock?, imagen_url, disponible, categorias, ingredientes, creado_en}`
  - `type ProductPublic = { ...Product but sin stock }`
  - `type Ingrediente = {id, nombre, es_alergeno}`
  - `type Categoria = {id, nombre}`

- [ ] 6.2 Create `frontend/src/features/products/api.ts` with axios API functions
  - `getProducts(page, limit, categoria_id?, search?, excluirAlergenos?)` → {data: [], pagination}
  - `getProductById(id)` → Product
  - `createProduct(data)` → Product (admin only)
  - `updateProduct(id, data)` → Product (admin only)
  - `deleteProduct(id)` → void (admin only)
  - `updateProductStock(id, cantidad)` → Product (admin only)
  - `assignCategories(id, categoria_ids)` → Product (admin only)
  - `assignIngredients(id, ingrediente_ids)` → Product (admin only)
  - Use centralized `apiClient` with auth interceptors

- [ ] 6.3 Create `frontend/src/features/products/store/productsStore.ts` with Zustand
  - State: `products: Product[]`, `currentProduct: Product | null`, `isLoading: bool`, `error: string | null`, `pagination: {page, limit, total, totalPages}`
  - Actions: `fetchProducts(filters)`, `fetchProductById(id)`, `setCurrentProduct(product)`, `setLoading(bool)`, `setError(string | null)`, `setPagination(pagination)`
  - Export hook: `useProducts()`
  - NO persistence (read-only from API; ephemeral state)

- [ ] 6.4 Write unit tests for store in `frontend/tests/productsStore.test.ts`
  - Test store initialization
  - Test setters update state correctly
  - Test pagination state updates

## Phase 7: Frontend Components

- [ ] 7.1 Create `frontend/src/features/products/components/ProductCard.tsx`
  - Props: `product: Product`, `onSelect?: (product) => void`
  - Displays: nombre, precio, imagen_url, disponible badge
  - Responsive grid layout
  - Click handler calls onSelect callback
  - Memoized with React.memo

- [ ] 7.2 Create `frontend/src/features/products/components/ProductDetailPage.tsx`
  - Uses `useParams` to get productId from URL
  - Uses `useProducts` store to fetch product on mount
  - Displays: full product details, categorias list, ingredientes list (allergens highlighted in red)
  - "Add to Cart" button (integrates with cart store from US-029)
  - Ingredient customization UI (checkboxes to exclude ingredients)
  - Loading spinner while fetching
  - Error message if product not found

- [ ] 7.3 Create `frontend/src/features/products/components/ProductGrid.tsx`
  - Props: `filters?: {categoria_id?, search?, excluirAlergenos?}`, `onProductSelect?: callback`
  - Uses `useProducts` store to fetch paginated list
  - Renders ProductCard for each product
  - Pagination controls (prev, next, page numbers)
  - Loading spinner while fetching
  - "No products found" message if empty
  - Responsive grid (2-4 columns based on screen size)

- [ ] 7.4 Create `frontend/src/features/products/components/ProductFilterBar.tsx`
  - Props: `onFilter: (filters) => void`
  - Inputs: search textbox, category dropdown, allergen multi-select
  - "Search" button triggers onFilter callback
  - Integrates with ProductGrid for real-time filtering

- [ ] 7.5 Update `frontend/src/pages/HomePage.tsx`
  - Render ProductGrid with FilterBar
  - Pass category from URL param to ProductGrid if navigating from category view

- [ ] 7.6 Create route in `frontend/src/app/App.tsx`
  - Route: `/products/:id` → ProductDetailPage
  - Route: `/products` → HomePage (or ProductGrid page)

## Phase 8: Frontend Tests

- [ ] 8.1 Write tests for ProductCard in `frontend/tests/ProductCard.test.tsx`
  - Test renders product info (nombre, precio)
  - Test onClick calls onSelect callback
  - Test memoization with React.memo (shallow comparison)

- [ ] 8.2 Write tests for ProductGrid in `frontend/tests/ProductGrid.test.tsx`
  - Mock API calls
  - Test fetches products on mount
  - Test renders list of ProductCards
  - Test pagination controls update page
  - Test loading/error states display correctly

- [ ] 8.3 Write tests for ProductDetailPage in `frontend/tests/ProductDetailPage.test.tsx`
  - Mock API call for single product
  - Test renders product details
  - Test allergen ingredients display in red
  - Test ingredient exclusion checkboxes

- [ ] 8.4 Write integration test in `frontend/tests/products.integration.test.ts`
  - Mock API with product catalog data
  - Test full flow: list → click product → view detail → add to cart

- [ ] 8.5 Run tests: `npm run test -- --testPathPattern="products"`

## Phase 9: Frontend Linting and Type Checking

- [ ] 9.1 Run ESLint: `npm run lint -- frontend/src/features/products/` → resolve errors

- [ ] 9.2 Run TypeScript compiler: `npm run build` → no errors

- [ ] 9.3 Format with Prettier: `npm run format`

## Phase 10: Manual Testing and Validation

- [ ] 10.1 Start backend in local dev: `cd backend && uvicorn app.main:app --reload`

- [ ] 10.2 Start frontend in local dev: `cd frontend && npm run dev`

- [ ] 10.3 Test backend endpoints with curl/Postman
  - Create product: `POST /api/v1/productos` with valid data → 201
  - Assign categories: `PUT /api/v1/productos/:id/categorias` with valid IDs → 200
  - Assign ingredients: `PUT /api/v1/productos/:id/ingredientes` with valid IDs → 200
  - List products: `GET /api/v1/productos?page=1&limit=20` → 200 with pagination
  - Filter by category: `GET /api/v1/productos?categoria=<id>` → returns products in that category
  - Search: `GET /api/v1/productos?busqueda=pizza` → ILIKE search works
  - Allergen filter: `GET /api/v1/productos?excluirAlergenos=<id1>,<id2>` → excludes products with those allergens
  - Get product: `GET /api/v1/productos/:id` → 200 with full details (no stock exposed)
  - Update product: `PUT /api/v1/productos/:id` → 200 updates correctly
  - Update stock: `PATCH /api/v1/productos/:id/stock` with {cantidad: 10} → stock increments
  - Delete product: `DELETE /api/v1/productos/:id` → 204, product no longer in public list
  - Test auth: `POST /api/v1/productos` without token → 401; as CLIENT role → 403

- [ ] 10.4 Test frontend UI
  - Homepage loads and displays product grid
  - Filter bar works: search, category filter, allergen filter
  - Pagination controls navigate between pages
  - Click on product → navigates to detail page
  - Detail page shows all product info, categorias, ingredientes
  - Allergen ingredients highlighted visually
  - Add to Cart button appears (even if not fully integrated)
  - Ingredient exclusion checkboxes functional

- [ ] 10.5 Test edge cases
  - Empty catalog (no products) → "No products found"
  - All products soft-deleted → empty public list
  - Update stock to 0 → disponible becomes false
  - Category with no products → empty list
  - Multiple page navigation → pagination works correctly

## Phase 11: Code Quality and Documentation

- [ ] 11.1 Run full backend test suite: `pytest backend/tests/ -v --cov=backend/app/productos`

- [ ] 11.2 Run full frontend test suite: `npm run test -- --coverage`

- [ ] 11.3 Verify backend type safety: `mypy backend/app` (should pass)

- [ ] 11.4 Verify frontend builds: `npm run build` (no errors, no TypeScript issues)

- [ ] 11.5 Add README to `backend/app/productos/README.md` documenting:
  - Database schema (link to migration)
  - Service/Repository layers
  - API endpoints overview
  - Example requests/responses
  - Authorization model

- [ ] 11.6 Add frontend FEATURES.md documenting:
  - Store structure
  - API client functions
  - Component tree
  - Usage examples

## Phase 12: Git Commits and PR Preparation

- [ ] 12.1 Create branch (if not already created): `git checkout -b change/us-015-productos`

- [ ] 12.2 Commit database migration: `git commit -m "feat(db): add Producto table and M2M relations for product catalog"`

- [ ] 12.3 Commit backend models: `git commit -m "feat(backend): implement Producto model and M2M schemas (ProductoCategoria, ProductoIngrediente)"`

- [ ] 12.4 Commit backend repository and service: `git commit -m "feat(backend): implement ProductRepository and ProductService with CRUD and validation"`

- [ ] 12.5 Commit backend router: `git commit -m "feat(backend): implement product CRUD endpoints with role-based authorization"`

- [ ] 12.6 Commit backend tests: `git commit -m "test(backend): add comprehensive tests for product operations and authorization"`

- [ ] 12.7 Commit frontend types and API client: `git commit -m "feat(frontend): add product types and API client functions"`

- [ ] 12.8 Commit frontend store: `git commit -m "feat(frontend): implement Zustand products store for state management"`

- [ ] 12.9 Commit frontend components: `git commit -m "feat(frontend): implement ProductCard, ProductDetailPage, ProductGrid, and FilterBar components"`

- [ ] 12.10 Commit frontend tests: `git commit -m "test(frontend): add component and integration tests for product features"`

- [ ] 12.11 Push branch: `git push origin change/us-015-productos`

- [ ] 12.12 Create pull request on GitHub with:
  - Title: "feat(products): implement complete product CRUD system (US-015)"
  - Description: Summary from proposal.md + design decisions + testing checklist

## Phase 13: Code Review and Merge

- [ ] 13.1 Address PR review comments

- [ ] 13.2 Ensure all CI checks pass (tests, linting, type checking)

- [ ] 13.3 Request re-review if substantial changes made

- [ ] 13.4 Merge PR to main with "Squash and Merge" or "Create a merge commit" (per team preference)

- [ ] 13.5 Delete branch after merge: `git push origin --delete change/us-015-productos`

## Phase 14: Final Verification and Archive

- [ ] 14.1 Verify all tests still pass on main: `npm run test:backend && npm run test:frontend`

- [ ] 14.2 Verify build succeeds: `npm run build`

- [ ] 14.3 Verify Swagger docs: `http://localhost:8000/docs` (after running backend)

- [ ] 14.4 Archive the change: `openspec archive us-015-productos`
  - Specs synced to `openspec/specs/product-*/`
  - Change moved to `openspec/changes/archive/`

- [ ] 14.5 Create completion summary: `docs/US-015-COMPLETION-SUMMARY.md` with:
  - What was implemented
  - Database schema summary
  - API endpoints list
  - Known limitations or tech debt
  - Recommendations for next phase

- [ ] 14.6 Update main README.md with product feature documentation

## Notes

**Dependencies Already Available**:
- US-001: Authentication (JWT, roles) ✓
- US-002: Categories ✓
- US-011: Ingredientes ✓
- Authorization middleware with `require_role` decorator ✓
- Unit of Work pattern (UoW) ✓

**Tech Stack**:
- Backend: FastAPI, SQLModel, PostgreSQL, Pydantic
- Frontend: React, TypeScript, Zustand, Axios, TanStack Query (optional for advanced caching)

**Quality Gates**:
- 80%+ test coverage for backend
- 70%+ test coverage for frontend
- No TypeScript errors
- No ESLint errors
- All docstrings present
- Conventional commits used

**Performance Expectations**:
- Product listing: < 100ms (with pagination)
- Product detail: < 50ms (with category/ingredient joins)
- Stock update: < 100ms (atomic transaction)
