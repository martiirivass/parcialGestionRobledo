## 1. Database Schema and Migrations

- [x] 1.1 Create Alembic migration: Add `categorias` table with self-referencing FK
  - Columns: `id` (UUID), `nombre` (VARCHAR 100), `parentId` (UUID nullable FK), `eliminado_en` (TIMESTAMP nullable), `creado_en` (TIMESTAMP), `actualizado_en` (TIMESTAMP)
  - Constraints: NOT NULL on nombre, UNIQUE on (parentId, nombre)
  - Indexes: `idx_categorias_parent_id`, `idx_categorias_eliminado_en`
  - Foreign key: `FOREIGN KEY (parentId) REFERENCES categorias(id) ON DELETE RESTRICT`
  
- [x] 1.2 Verify migration is reversible: `alembic downgrade -1` succeeds without errors

- [x] 1.3 Apply migration to development database: `alembic upgrade head`

## 2. Backend Data Model and Repository

- [x] 2.1 Create SQLModel `Category` class in `backend/app/models/category.py`
  - Fields: id (UUID, primary_key), nombre (str, max_length=100), parentId (Optional[UUID], FK), eliminado_en (Optional[datetime]), creado_en (datetime), actualizado_en (datetime)
  - Use SQLAlchemy ForeignKey for parentId with cascade rules
  - Add datetime defaults using `default_factory=datetime.utcnow`

- [x] 2.2 Create `CategoryRepository` in `backend/app/repositories/category_repository.py`
  - Inherit from `BaseRepository[Category]`
  - Implement `get_hierarchy()` → List[dict] using CTE recursive query
  - Implement `validate_no_cycles(category_id, proposed_parent_id)` → bool
  - Implement `check_has_products(category_id)` → bool (query ProductoCategoria)
  - Implement `list_by_parent(parent_id)` → List[Category]

- [x] 2.3 Add `CategoryRepository` to `UnitOfWork` class as `self.categorias`

## 3. Backend Business Logic and Service Layer

- [x] 3.1 Create `CategoryService` in `backend/app/categorias/service.py`
  - Implement `create_category(nombre, parent_id, uow)` with validations:
    - Check parent exists if provided
    - Check no cycles with `validate_no_cycles()`
    - Create new category with auto-assigned UUID
  - Implement `update_category(id, nombre, parent_id, uow)` with validations
  - Implement `delete_category(id, uow)` with product check:
    - Verify no active products via `check_has_products()`
    - Perform soft delete (set `eliminado_en = now()`)
  - Implement `get_category_by_id(id, uow, include_deleted=False)`
  - Implement `get_category_tree(uow)` → nested JSON structure

- [x] 3.2 Write unit tests for `CategoryService` in `backend/tests/test_categorias_service.py`
  - Test cycle detection (A → B → A rejected)
  - Test self-reference rejection (A cannot be parent of itself)
  - Test product check prevents deletion
  - Test soft delete sets timestamp
  - Test tree structure generation

## 4. Backend API Endpoints

- [x] 4.1 Create Pydantic schemas in `backend/app/categorias/schemas.py`
  - `CategoryBase` with `nombre` (required, max_length=100), `parentId` (optional UUID)
  - `CategoryCreate` inheriting CategoryBase
  - `CategoryUpdate` with all fields optional
  - `CategoryResponse` with id, nombre, parentId, creado_en, actualizado_en, deletedAt
  - `CategoryTreeResponse` with id, nombre, subcategorias (recursive)

- [x] 4.2 Create router in `backend/app/categorias/router.py`
  - `POST /api/v1/categorias` → create category (ADMIN/STOCK only)
    - Validate input with Pydantic
    - Call `CategoryService.create_category()`
    - Return 201 with CategoryResponse
    - Return 409 if duplicate name
    - Return 404 if parent doesn't exist
  - `GET /api/v1/categorias` → get complete tree (public)
    - No authentication required
    - Call `CategoryService.get_category_tree()`
    - Return list of nested CategoryTreeResponse
    - Return 200
  - `GET /api/v1/categorias/:id` → get single category (ADMIN/STOCK only)
    - Query parameter: `includeDeleted` (bool, default false)
    - Call `CategoryService.get_category_by_id()`
    - Return 200 with CategoryResponse
    - Return 404 if not found
  - `PUT /api/v1/categorias/:id` → update category (ADMIN/STOCK only)
    - Accept CategoryUpdate payload
    - Call `CategoryService.update_category()`
    - Return 200 with updated CategoryResponse
    - Return 400 if cycle would be created
    - Return 404 if category or parent not found
  - `DELETE /api/v1/categorias/:id` → soft delete (ADMIN/STOCK only)
    - Call `CategoryService.delete_category()`
    - Return 204 No Content on success
    - Return 409 if products exist
    - Return 404 if not found

- [x] 4.3 Register router in `backend/app/main.py`: `app.include_router(categorias_router, prefix="/api/v1", tags=["categorias"])`

- [x] 4.4 Add `require_role(["ADMIN", "STOCK"])` dependency to protected endpoints if not already implemented

## 5. Backend Integration Tests

- [x] 5.1 Create integration tests in `backend/tests/test_categorias_router.py`
  - Test POST /categorias with valid data → 201
  - Test POST /categorias with duplicate name → 409
  - Test POST /categorias with invalid parent → 404
  - Test GET /categorias public endpoint → 200 with tree
  - Test GET /categorias/:id with valid ID → 200
  - Test GET /categorias/:id with invalid ID → 404
  - Test PUT /categorias/:id with cycle attempt → 400
  - Test DELETE /categorias/:id with no products → 204
  - Test DELETE /categorias/:id with products → 409
  - Test authorization: CLIENT role on POST/PUT/DELETE → 403

- [x] 5.2 Verify all tests pass: `pytest backend/tests/test_categorias_router.py -v`

## 6. Frontend State Management

- [x] 6.1 Create `useCategoriesStore` in `frontend/src/features/categories/store/categoriesStore.ts`
  - State: `categories` (CategoryTree[]), `isLoading` (bool), `error` (string|null)
  - Actions: `fetchTree()`, `setCategories()`, `setLoading()`, `setError()`
  - NO persistence (read-only from API)
  - Export hook `useCategories()`

- [x] 6.2 Create API client functions in `frontend/src/features/categories/api.ts`
  - `getCategoryTree()` → fetch GET /api/v1/categorias
  - `createCategory(nombre, parentId)` → POST /api/v1/categorias
  - `updateCategory(id, nombre, parentId)` → PUT /api/v1/categorias/:id
  - `deleteCategory(id)` → DELETE /api/v1/categorias/:id
  - Use centralized `apiClient` with interceptors

## 7. Frontend Components

- [x] 7.1 Create `CategoryTree` component in `frontend/src/features/categories/components/CategoryTree.tsx`
  - Props: `categories` (CategoryTree[]), `onSelect` (callback)
  - Recursive rendering: each category shows children in nested list
  - Use memoization (`React.memo`) to prevent unnecessary re-renders
  - Expand/collapse state management for each category

- [x] 7.2 Create `CategoryTreeContainer` in `frontend/src/features/categories/components/CategoryTreeContainer.tsx`
  - Use `useCategoriesStore` to fetch tree on mount
  - Handle loading/error states
  - Pass categories to `CategoryTree`

- [x] 7.3 Add `CategoryTreeContainer` to homepage/navbar for category navigation
  - Display as dropdown or sidebar menu
  - Make categories clickable to filter product listing

## 8. Frontend Tests

- [x] 8.1 Write unit tests in `frontend/tests/CategoryTree.test.tsx`
  - Test recursive rendering of nested categories
  - Test expand/collapse behavior
  - Test memoization prevents re-renders on unchanged props

- [x] 8.2 Write integration test in `frontend/tests/categories.integration.test.ts`
  - Mock API with category tree data
  - Test fetch on mount
  - Test error handling on API failure

## 9. Manual Testing and Validation

- [x] 9.1 Start backend: `cd backend && uvicorn app.main:app --reload`

- [x] 9.2 Start frontend: `cd frontend && npm run dev`

- [x] 9.3 Test backend endpoints with Postman/curl:
  - Create root category "Fruits"
  - Create subcategory "Citrus" under "Fruits"
  - Attempt to create cycle → should fail with 400
  - Fetch tree → should return nested structure
  - Update category name
  - Delete empty category → should succeed with 204

- [x] 9.4 Test frontend:
  - Navigate to homepage
  - Verify category tree loads and displays
  - Verify categories are clickable
  - Verify loading spinner appears during fetch
  - Verify error message if API fails

## 10. Code Quality and Documentation

- [x] 10.1 Run backend linting: `pylint backend/app/categorias/`

- [x] 10.2 Run backend type checking: `mypy backend/app/categorias/`

- [x] 10.3 Run frontend linting: `npm run lint`

- [x] 10.4 Run frontend type checking: `npm run build`

- [x] 10.5 Add docstrings to all public methods
  - CategoryService methods: describe parameters, return type, exceptions
  - Repository methods: describe SQL behavior

- [x] 10.6 Update backend API documentation (if using Swagger/OpenAPI): verify /docs endpoint shows category endpoints

## 11. Git Commits and PR Preparation

- [x] 11.1 Create branch: `git checkout -b change/us-002-categorias`

- [x] 11.2 Commit database migration: `git commit -m "feat(db): add categorias table with self-referencing FK for hierarchical structure"`

- [x] 11.3 Commit backend model/repo: `git commit -m "feat(backend): implement Category model and CategoryRepository with CTE queries"`

- [x] 11.4 Commit backend service/routes: `git commit -m "feat(backend): implement category CRUD endpoints with cycle validation"`

- [x] 11.5 Commit backend tests: `git commit -m "test(backend): add comprehensive tests for category operations"`

- [x] 11.6 Commit frontend store/api: `git commit -m "feat(frontend): implement categories store and API client"`

- [x] 11.7 Commit frontend components: `git commit -m "feat(frontend): add recursive CategoryTree component"`

- [x] 11.8 Commit frontend tests: `git commit -m "test(frontend): add tests for category tree rendering"`

- [x] 11.9 Push branch: `git push origin change/us-002-categorias`

- [x] 11.10 Create pull request with summary from proposal.md

## 12. Final Verification and Archive

- [x] 12.1 All tests pass: `npm run test:backend && npm run test:frontend`

- [x] 12.2 No TypeScript errors: `npm run build`

- [x] 12.3 No Python type errors: `mypy backend/app`

- [x] 12.4 PR approved and merged to main

- [x] 12.5 Archive the change: `openspec archive us-002-categorias`
  - Specs synced to `openspec/specs/category-management/` and `openspec/specs/category-browsing/`
  - Change moved to `openspec/changes/archive/`

- [x] 12.6 Update FINAL-SUMMARY.md with completion details
