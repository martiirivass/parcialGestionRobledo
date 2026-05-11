## Why

The Food Store e-commerce platform requires a comprehensive product management system to support its core business function: selling food products to customers. Currently, the system has authentication (US-001), categories (US-002), and user management infrastructure, but no way to create, manage, or list products. Implementing a full CRUD product system with stock management, pricing, and association with categories and ingredients is essential to enable customers to browse and purchase items. This is a critical foundational capability for all subsequent shopping features (cart, orders, payments).

## What Changes

- **New**: Product model with fields: name, description, price (NUMERIC precision), stock (integer >= 0), image URL, availability flag
- **New**: Product CRUD endpoints for admin/stock users (POST create, PUT update, DELETE soft delete)
- **New**: Public product listing endpoint with pagination, filtering by category, and search by name
- **New**: Product detail endpoint showing full information including associated categories and ingredients
- **New**: Stock management endpoint to atomically update product inventory
- **New**: Associations: Product-to-Category (M2M via ProductoCategoria) and Product-to-Ingredient (M2M via ProductoIngrediente)
- **New**: Soft delete support for products preserving historical data for orders
- **New**: Stock validation to prevent negative inventory
- **Modified**: Authorization system to support STOCK role access to product management endpoints

## Capabilities

### New Capabilities

- `product-creation`: CRUD operations for creating, reading, updating, and deleting products with role-based authorization (ADMIN/STOCK only for writes)
- `product-catalog-browsing`: Public endpoint to retrieve products with pagination, category filtering, search, and allergen filtering
- `product-inventory-management`: Atomic operations to update product stock levels while preventing negative inventory
- `product-category-association`: M2M relationships between products and categories for flexible product organization
- `product-ingredient-association`: M2M relationships between products and ingredients to support allergen information and personalization

### Modified Capabilities

- `user-authorization-foundation`: Extend RBAC system to validate STOCK role for product management endpoints (POST, PUT, DELETE)

## Impact

**Backend**:
- New model: `Product` with self-referencing relationships to categories and ingredients
- New models: `ProductoCategoria` and `ProductoIngrediente` (M2M pivot tables)
- New service: `ProductService` with business logic for CRUD and validation
- New repository: `ProductRepository` with specialized queries (filters, search, pagination)
- New router: `/api/v1/productos` endpoints
- New database migrations for Product table and M2M tables
- All product endpoints follow REST conventions and Pydantic validation

**Frontend**:
- New hook: `useProducts()` to fetch products with caching and filtering
- New component: `ProductCard` for displaying product summary
- New component: `ProductDetailPage` for full product view
- New component: `ProductGrid` with pagination and filtering controls
- Integration with existing `apiClient` and auth store

**Database**:
- New table: `productos` with columns: `id`, `nombre`, `descripcion`, `precio` (NUMERIC 10,2), `stock` (INTEGER >= 0), `imagen_url`, `disponible` (BOOLEAN), `eliminado_en` (TIMESTAMP nullable), `creado_en`, `actualizado_en`
- New table: `producto_categoria` (M2M) with columns: `producto_id`, `categoria_id`
- New table: `producto_ingrediente` (M2M) with columns: `producto_id`, `ingrediente_id`
- Constraints: price > 0, stock >= 0, unique constraints on M2M relationships
- Indexes on `producto_id`, `categoria_id`, `ingrediente_id` for efficient joins
- Soft delete support preserving product records for order history

**Authorization**:
- POST/PUT/DELETE `/api/v1/productos` require ADMIN or STOCK role
- GET `/api/v1/productos` is public (no auth required)
- GET `/api/v1/productos/:id` is public (no auth required)

**Testing**:
- Unit tests for price/stock validation logic
- Integration tests for CRUD endpoints
- Authorization tests ensuring only STOCK/ADMIN can modify products
- Database tests for M2M relationships and soft delete behavior

## Summary

This change implements the complete product management system required to support Food Store's e-commerce functionality. It builds on the existing authentication (US-001) and category (US-002) infrastructure to provide a production-ready product catalog with flexible organization, accurate inventory tracking, and public browsing capabilities.
