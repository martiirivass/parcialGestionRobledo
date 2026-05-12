# Product Catalog Module (US-015-Productos)

Complete product management system with hierarchical categories, ingredient management, and allergen tracking.

## Database Schema

### Tables

#### `catalogo` (Base Catalog)
- **id** (UUID): Primary key
- **nombre** (VARCHAR 255): Product name (unique)
- **descripcion** (TEXT): Detailed product description
- **precio** (NUMERIC 10,2): Product price in pesos (immutable after creation)
- **stock** (INTEGER): Current inventory count
- **imagen_url** (VARCHAR 500): URL to product image
- **disponible** (BOOLEAN): Availability flag (calculated: stock > 0 AND NOT soft-deleted)
- **creado_en** (TIMESTAMP): Creation timestamp (auto-set)
- **actualizado_en** (TIMESTAMP): Last update timestamp (auto-update)
- **eliminado_en** (TIMESTAMP): Soft-delete timestamp (NULL if active)
- **creado_por_id** (UUID, FK→usuarios.id): Creator user reference
- **actualizado_por_id** (UUID, FK→usuarios.id): Last updater reference

**Indexes**: 
- PRIMARY: id
- UNIQUE: nombre
- COVERING: (disponible, eliminado_en) for public listing queries

#### `catalogo_categoria` (Product-Category M:M)
- **id** (UUID): Primary key
- **catalogo_id** (UUID, FK→catalogo.id): Product reference
- **categoria_id** (UUID, FK→categoria.id): Category reference
- **PRIMARY KEY**: (catalogo_id, categoria_id)

#### `catalogo_ingrediente` (Product-Ingredient M:M)
- **id** (UUID): Primary key
- **catalogo_id** (UUID, FK→catalogo.id): Product reference
- **ingrediente_id** (UUID, FK→ingrediente.id): Ingredient reference
- **esAlergeno** (BOOLEAN): Whether ingredient is an allergen for this product
- **PRIMARY KEY**: (catalogo_id, ingrediente_id)

### Relationships

```
Product (catalogo)
  ├── M:M Categories (via catalogo_categoria)
  ├── M:M Ingredients (via catalogo_ingrediente)
  └── Tracks: creado_por, actualizado_por (references usuarios)

Category (categoria)
  └── 1:M Products (inverse)

Ingredient (ingrediente)
  └── 1:M Products (inverse)
  └── has: es_alergeno flag (boolean)
```

### Migration

See: `backend/migrations/versions/001_initial_schema.py`

Run with: `alembic upgrade head`

## Architecture

### Layers

```
ProductRouter (HTTP Layer)
  ↓ (FastAPI endpoints + validation)
ProductService (Business Logic)
  ↓ (validations, rules, state management)
ProductRepository (Data Access)
  ↓ (SQL queries, ORM operations)
SQLModel / SQLAlchemy (Database Layer)
  ↓
PostgreSQL Database
```

### Key Components

#### ProductRepository (`repository.py`)
**Responsibilities**: Query execution, ORM mapping, transaction management

**Methods**:
- `list_all(skip, limit, filters)` - Paginated product listing with filtering
- `get_by_id(id)` - Single product retrieval with relationships
- `create(product_data)` - Atomic product creation with audit trail
- `update(id, updates)` - Partial updates with versioning
- `delete(id)` - Soft-delete with timestamp
- `update_stock(id, amount, operation)` - Atomic stock modification with SELECT FOR UPDATE
- `filter_by_category(category_id)` - Products in category (recursive if hierarchical)
- `filter_by_allergen(allergen_ids)` - Exclude products with allergens
- `search(query)` - Full-text search (ILIKE)

**Features**:
- Soft-delete support: `WHERE eliminado_en IS NULL`
- Atomic stock updates: `SELECT ... FOR UPDATE`
- Audit trail: `creado_en`, `actualizado_en`, `creado_por_id`, `actualizado_por_id`
- Transaction support: All writes wrapped in db.commit()

#### ProductService (`service.py`)
**Responsibilities**: Business logic, validation, orchestration

**Methods**:
- `create_product(data, current_user)` - Validate & create product with audit
- `get_product(id)` - Retrieve with full relationships
- `update_product(id, data, current_user)` - Update with validation
- `delete_product(id, current_user)` - Soft-delete with audit
- `update_product_stock(id, amount, operation)` - Atomic stock update
- `assign_categories(product_id, category_ids)` - Link product to categories
- `assign_ingredients(product_id, ingredient_data)` - Link product to ingredients
- `list_products_with_filters(filters)` - Complex filtering & pagination

**Validations**:
- Price > 0, immutable after creation
- Stock >= 0
- Category exists and is active
- Ingredient exists and is active
- Allergen flags match ingredient metadata
- User has ADMIN role for mutations

#### Schemas (`schemas.py`)
**Request/Response models** using Pydantic v2

```python
class ProductCreate(BaseModel):
    nombre: str  # min_length=3, max_length=255
    descripcion: Optional[str]
    precio: Decimal  # > 0
    stock: int  # >= 0
    imagen_url: str  # valid URL

class ProductResponse(ProductBase):
    id: UUID
    disponible: bool  # computed: stock > 0 AND not deleted
    categorias: list[CategoriaResponse]
    ingredientes: list[IngredienteResponse]
    creado_en: datetime
    actualizado_en: datetime

class ProductFilters(BaseModel):
    page: int = 1
    limit: int = 20
    categoria_id: Optional[UUID]
    busqueda: Optional[str]  # ILIKE search
    excluirAlergenos: Optional[list[UUID]]  # allergen exclusion
```

#### Router (`router.py`)
**HTTP Endpoints** with authorization

```
POST   /api/v1/productos
       Create product (ADMIN only)
       Input: ProductCreate
       Output: ProductResponse (201)
       Auth: JWT + require_role("admin")

GET    /api/v1/productos
       List products with pagination & filtering
       Params: page, limit, categoria_id, busqueda, excluirAlergenos
       Output: Page[ProductResponse] (200)
       Auth: Public (JWT optional for better rate limits)

GET    /api/v1/productos/:id
       Get single product with full details
       Output: ProductResponse (200) or 404
       Auth: Public

PUT    /api/v1/productos/:id
       Update product fields (ADMIN only)
       Input: ProductUpdate
       Output: ProductResponse (200)
       Auth: JWT + require_role("admin")

PATCH  /api/v1/productos/:id/stock
       Update product stock atomically (ADMIN only)
       Input: {"cantidad": int, "operacion": "increment"|"decrement"|"set"}
       Output: {"stock": int} (200)
       Auth: JWT + require_role("admin")

DELETE /api/v1/productos/:id
       Soft-delete product (ADMIN only)
       Output: 204 No Content
       Auth: JWT + require_role("admin")

PUT    /api/v1/productos/:id/categorias
       Assign categories to product (ADMIN only)
       Input: {"categoria_ids": list[UUID]}
       Output: {"categorias": list[CategoriaResponse]} (200)
       Auth: JWT + require_role("admin")

PUT    /api/v1/productos/:id/ingredientes
       Assign ingredients to product (ADMIN only)
       Input: [{"ingrediente_id": UUID, "esAlergeno": bool}]
       Output: {"ingredientes": list[IngredienteResponse]} (200)
       Auth: JWT + require_role("admin")
```

## API Examples

### Create Product (Admin Only)

**Request**:
```bash
curl -X POST http://localhost:8000/api/v1/productos \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Leche Entera 1L",
    "descripcion": "Leche fresca de vaca premium",
    "precio": 250.50,
    "stock": 100,
    "imagen_url": "https://cdn.example.com/leche.jpg"
  }'
```

**Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nombre": "Leche Entera 1L",
  "descripcion": "Leche fresca de vaca premium",
  "precio": "250.50",
  "stock": 100,
  "disponible": true,
  "imagen_url": "https://cdn.example.com/leche.jpg",
  "categorias": [],
  "ingredientes": [],
  "creado_en": "2026-05-12T22:30:00Z",
  "actualizado_en": "2026-05-12T22:30:00Z"
}
```

### List Products with Filtering

**Request**:
```bash
curl "http://localhost:8000/api/v1/productos?page=1&limit=20&categoria_id=cat-123&busqueda=leche&excluirAlergenos=alergen-1,alergen-2"
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "nombre": "Leche Entera 1L",
      "precio": "250.50",
      "disponible": true,
      "categorias": [{"id": "cat-123", "nombre": "Lácteos"}],
      "ingredientes": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

### Update Stock

**Request**:
```bash
curl -X PATCH http://localhost:8000/api/v1/productos/550e8400-e29b-41d4-a716-446655440000/stock \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"cantidad": 5, "operacion": "decrement"}'
```

**Response** (200 OK):
```json
{
  "stock": 95,
  "disponible": true
}
```

## Authorization Model

### Role-Based Access Control (RBAC)

| Operation | Required Role | Additional Checks |
|-----------|---------------|-------------------|
| List products | PUBLIC | None |
| Get product detail | PUBLIC | Must exist, not soft-deleted |
| Create product | ADMIN | Must own organization (future) |
| Update product | ADMIN | Creator or organization member |
| Delete product (soft) | ADMIN | Creator or organization member |
| Update stock | ADMIN | None |
| Assign categories | ADMIN | Categories must exist |
| Assign ingredients | ADMIN | Ingredients must exist |

### Decorator: `@require_role("admin")`
```python
@require_role("admin")
async def create_product(data: ProductCreate, current_user: User):
    # Only ADMIN users can reach here
    ...
```

## Performance Expectations

| Operation | Expected Response Time | Notes |
|-----------|----------------------|-------|
| List products (page 1, 20 items) | < 100ms | With indexes on (disponible, eliminado_en) |
| Get product detail | < 50ms | With eager-loading of relationships |
| Create product | < 200ms | Includes audit trail writes |
| Update stock (atomic) | < 100ms | SELECT FOR UPDATE provides atomicity |
| Search (ILIKE) | < 500ms | Index-friendly pattern matching |

## Testing

### Unit Tests
- Repository layer: CRUD operations, filtering, soft-delete
- Service layer: Validation, authorization, state transitions
- Schemas: Pydantic validation, serialization

### Integration Tests
- API endpoints: Full request/response lifecycle
- Database layer: Transaction atomicity, constraint enforcement
- Authorization: Role-based access control

**Coverage Target**: 80%+ for productos module

**Run Tests**:
```bash
pytest backend/tests/test_productos/ -v --cov=backend/app/productos
```

## Known Limitations & Future Work

1. **Hierarchical Categories**: Currently flat. Can extend to parent_id for tree structure.
2. **Product Variants**: No size/color variants yet. Future: separate SKU table.
3. **Bulk Operations**: No bulk create/update endpoint. Future: async jobs with RQ.
4. **Search**: Basic ILIKE. Future: Full-text search with PostgreSQL trigrams or Elasticsearch.
5. **Image Storage**: URLs only. Future: Upload to S3 with CDN.
6. **Recommendations**: No product recommendations. Future: Collaborative filtering.

## Dependencies

- **FastAPI** >= 0.115.0
- **SQLModel** >= 0.0.21
- **PostgreSQL** >= 15
- **SQLAlchemy** >= 2.0
- **Pydantic** >= 2.10

## Related Modules

- **US-001**: Authentication & JWT (required)
- **US-002**: Categories (required for product assignment)
- **US-011**: Ingredients (required for allergen tracking)
- **US-004**: Shopping Cart (consumes product list)
- **US-005**: Orders (consumes product data)
- **US-007**: Admin Panel (produces product management UI)

## Maintainer

@team-backend

## Last Updated

2026-05-12
