# Product Feature Module (US-015-Productos)

Product catalog system for FoodStore with browsing, filtering, and ingredient customization.

## Architecture Overview

This feature implements a complete product catalog with:
- Paginated product listing
- Multi-criteria filtering (search, category, allergen exclusion)
- Product detail page with ingredient management
- Responsive UI (mobile-first design)
- TypeScript strict mode

## Store Structure (Zustand)

### File: `src/features/products/store/productsStore.ts`

**State Interface**:
```typescript
interface ProductsState {
  // Data
  products: ProductPublic[];
  currentProduct: ProductPublic | null;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Pagination
  pagination: PaginationResponse & { page: number; limit: number };

  // Actions
  fetchProducts: (filters?: ProductFilters) => Promise<void>;
  fetchProductById: (id: string) => Promise<void>;
  setCurrentProduct: (product: ProductPublic | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void>;
  setPagination: (...) => void;
  clearProducts: () => void;
}
```

**Key Methods**:
- `fetchProducts(filters)` - Fetch products with pagination & filtering
- `fetchProductById(id)` - Fetch single product with full relationships
- `clearProducts()` - Reset store to initial state

**Usage**:
```typescript
import { useProducts } from "@/features/products/store/productsStore";

function MyComponent() {
  const { products, isLoading, fetchProducts } = useProducts();

  useEffect(() => {
    fetchProducts({ page: 1, limit: 20 });
  }, [fetchProducts]);

  if (isLoading) return <div>Loading...</div>;
  return <div>{products.map(p => <ProductCard key={p.id} product={p} />)}</div>;
}
```

## API Client

### File: `src/features/products/api.ts`

**Endpoints**:
```typescript
getProducts(filters?: ProductFilters): Promise<PaginatedResponse<ProductPublic>>
  // GET /api/v1/productos?page=1&limit=20&categoria_id=...&busqueda=...&excluirAlergenos=...

getProductById(id: string): Promise<ProductPublic>
  // GET /api/v1/productos/:id

getCategories(): Promise<CategoriaResponse[]>
  // GET /api/v1/categorias

getIngredientes(): Promise<IngredienteResponse[]>
  // GET /api/v1/ingredientes

createProduct(data: ProductCreate): Promise<ProductPublic>
  // POST /api/v1/productos (ADMIN only)

updateProduct(id: string, data: ProductUpdate): Promise<ProductPublic>
  // PUT /api/v1/productos/:id (ADMIN only)

updateStock(id: string, amount: number, operation: string): Promise<{ stock: number }>
  // PATCH /api/v1/productos/:id/stock (ADMIN only)
```

**HTTP Client Configuration** (`shared/api/axios.ts`):
- Base URL: `VITE_API_URL` (defaults to http://localhost:8000)
- JWT Authorization: Automatic Bearer token injection
- Retry Logic: 3 retries on 5xx errors with exponential backoff
- Timeout: 30 seconds

**Error Handling**:
```typescript
try {
  const data = await getProducts({ page: 1 });
} catch (error) {
  if (error.response?.status === 401) {
    // Handle unauthorized
  } else if (error.response?.status === 404) {
    // Handle not found
  }
}
```

## Component Hierarchy

```
HomePage
├── ProductFilterBar
│   ├── Search input (debounced)
│   ├── Category filter (dropdown)
│   ├── Allergen checkboxes (multi-select)
│   └── Clear filters button
│
├── ProductGrid
│   ├── ProductCard (repeating)
│   │   ├── Product image
│   │   ├── Availability badge (green/gray)
│   │   ├── Category tags
│   │   ├── Price display
│   │   └── Allergen warning (if applicable)
│   │
│   └── Pagination controls
│       ├── Previous button
│       ├── Page indicator
│       └── Next button

ProductDetailPage
├── Product image (large)
├── Product info
│   ├── Name
│   ├── Price
│   ├── Description
│   └── Availability badge
├── Categories
├── Ingredients & Allergens
│   ├── Regular ingredients (gray)
│   ├── Allergen ingredients (red warning)
│   └── Ingredient exclusion checkboxes
├── Add to Cart button
└── Back button
```

## Components

### ProductCard (`src/features/products/components/ProductCard.tsx`)

**Purpose**: Display single product in grid

**Props**:
```typescript
interface ProductCardProps {
  product: ProductPublic;
}
```

**Features**:
- Image with hover zoom effect
- Availability badge (green "Available" / gray "Out of Stock")
- Allergen warning badge (red ⚠️ icon)
- Category tags
- Price display
- Click handler (navigate to detail)

**Styling**: Tailwind CSS responsive grid (2-4 columns)

**Example**:
```tsx
<ProductCard product={{
  id: "1",
  nombre: "Leche Entera",
  precio: 250.50,
  disponible: true,
  imagen_url: "...",
  categorias: [{ id: "1", nombre: "Lácteos" }],
  ingredientes: [
    { id: "1", nombre: "Leche", es_alergeno: false },
  ]
}} />
```

### ProductGrid (`src/features/products/components/ProductGrid.tsx`)

**Purpose**: Grid layout with pagination

**Props**:
```typescript
interface ProductGridProps {
  filters?: ProductFilters;
}
```

**Features**:
- Responsive layout (1-4 columns based on screen)
- Pagination controls (prev/next, page indicator)
- Loading spinner
- Empty state ("No products found")
- Error state with retry button

**Example**:
```tsx
<ProductGrid filters={{
  page: 1,
  limit: 20,
  categoria_id: "cat-123"
}} />
```

### ProductFilterBar (`src/features/products/components/ProductFilterBar.tsx`)

**Purpose**: Multi-criteria filtering UI

**Features**:
- **Search**: Debounced text input (300ms)
- **Category Filter**: Dropdown (single select)
- **Allergen Filter**: Checkboxes (multi-select)
- **Clear Filters**: Reset all to defaults
- **Responsive**: Stack on mobile, flex on desktop

**Callbacks**:
- `onFilter(filters)` - Called when any filter changes

**Example**:
```tsx
<ProductFilterBar
  onFilter={(filters) => {
    fetchProducts(filters);
  }}
/>
```

### ProductDetailPage (`src/features/products/components/ProductDetailPage.tsx`)

**Purpose**: Full product details page

**Features**:
- Full product information display
- Category listing
- Ingredient separation (allergens highlighted red)
- Ingredient exclusion checkboxes
- Availability badge
- Add to Cart placeholder
- Back button

**State Management**:
- Uses `useProducts()` store for data
- Local state for excluded ingredients

**Example**:
```tsx
function MyPage() {
  return <ProductDetailPage />;
  // Auto-loads product based on URL param :id
}
```

## Data Types

### File: `src/features/products/types.ts`

```typescript
// Public API responses
interface ProductPublic {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  disponible: boolean; // computed: stock > 0
  imagen_url: string;
  categorias: CategoriaResponse[];
  ingredientes: IngredienteResponse[];
  creado_en: string; // ISO 8601
  actualizado_en: string;
}

interface CategoriaResponse {
  id: string;
  nombre: string;
  descripcion?: string;
}

interface IngredienteResponse {
  id: string;
  nombre: string;
  es_alergeno: boolean;
  descripcion?: string;
}

interface ProductFilters {
  page?: number;
  limit?: number;
  categoria_id?: string;
  busqueda?: string;
  excluirAlergenos?: string[]; // allergen IDs to exclude
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

## Usage Examples

### Fetch and Display Products

```typescript
import { useProducts } from "@/features/products/store/productsStore";

export function ProductsPage() {
  const { products, isLoading, pagination, fetchProducts } = useProducts();

  useEffect(() => {
    fetchProducts({ page: 1, limit: 20 });
  }, [fetchProducts]);

  if (isLoading) return <LoadingSpinner />;
  if (!products.length) return <div>No products found</div>;

  return (
    <div>
      <ProductFilterBar
        onFilter={(filters) => fetchProducts({ ...filters, page: 1 })}
      />
      <ProductGrid filters={{ page: pagination.page }} />
    </div>
  );
}
```

### Access Individual Product

```typescript
import { useProducts } from "@/features/products/store/productsStore";
import { useParams } from "react-router-dom";

export function ProductDetailPage() {
  const { id } = useParams();
  const { currentProduct, fetchProductById } = useProducts();

  useEffect(() => {
    if (id) fetchProductById(id);
  }, [id, fetchProductById]);

  if (!currentProduct) return <div>Loading...</div>;

  return (
    <div>
      <img src={currentProduct.imagen_url} alt={currentProduct.nombre} />
      <h1>{currentProduct.nombre}</h1>
      <p>${currentProduct.precio}</p>
      <button>Add to Cart</button>
    </div>
  );
}
```

### Filter with Allergen Exclusion

```typescript
const allergicTo = ["shellfish", "peanut"];

fetchProducts({
  page: 1,
  limit: 20,
  busqueda: "dairy",
  categoria_id: "lacteos",
  excluirAlergenos: allergicTo
});
```

## Styling

### Tailwind CSS Classes Used

**Grid System**:
- `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` - Responsive grid
- `gap-4 md:gap-6` - Responsive spacing

**Components**:
- `rounded-lg shadow-md hover:shadow-xl` - Card styling
- `bg-white p-4 md:p-6` - Card padding
- `px-3 py-1 rounded-full text-xs` - Badge styling

**Colors**:
- Green: `bg-green-500 text-white` (available)
- Gray: `bg-gray-400 text-white` (out of stock)
- Red: `bg-red-100 text-red-800` (allergens)

**Responsive**:
- Mobile: Single column, full width
- Tablet (md): 2-3 columns
- Desktop (lg): 3-4 columns

## Testing

### Test Files

- `tests/components/ProductCard.test.tsx` - ProductCard rendering and props
- `tests/components/ProductGrid.test.tsx` - Grid layout, pagination, loading states
- `tests/components/ProductFilterBar.test.tsx` - Filter inputs, callbacks
- `tests/components/ProductDetailPage.test.tsx` - Detail page display, navigation
- `tests/pages/HomePage.test.tsx` - Full integration of filters + grid + detail

### Running Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test -- --coverage

# Run specific file
npm run test -- ProductCard.test.tsx

# Watch mode
npm run test -- --watch
```

**Coverage Target**: ≥70% for product module

**Test Utilities Used**:
- `@testing-library/react`: render, screen, waitFor
- `@testing-library/user-event`: user interactions
- `vitest`: mocking, assertions

## Performance Optimization

### Strategies Used

1. **Pagination**: Load only 20 items per page (configurable)
2. **Debounced Search**: 300ms delay before API call
3. **Lazy Relationships**: Load categories/ingredients with product
4. **Memoization**: ProductCard memoized to prevent re-renders
5. **Responsive Images**: Image optimization in HTML (future: srcset)

### Metrics

- Page load: < 1s (with network)
- Filter update: < 500ms (with debounce)
- Detail page navigation: < 200ms

## Accessibility (A11y)

### Features

- Semantic HTML (`<button>`, `<img alt>`, `<label for>`)
- ARIA labels on interactive elements
- Keyboard navigation support
- Color contrast ratios (WCAG AA)
- Loading states announced to screen readers

## Browser Compatibility

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile: iOS Safari 12+, Chrome Android 80+

## Related Modules

- **Auth** (`features/auth`): JWT tokens, user identification
- **Cart** (`features/cart`): Add products to cart
- **Payment** (`features/payment`): Checkout integration
- **UI** (`features/ui`): Shared form components, spinners

## Environment Variables

```env
# API Configuration
VITE_API_URL=http://localhost:8000

# Features (optional)
VITE_PRODUCTS_PER_PAGE=20
VITE_SEARCH_DEBOUNCE_MS=300
```

## Future Enhancements

1. **Product Reviews & Ratings**
2. **Wishlist / Favorites**
3. **Advanced Filtering** (price range, ratings, recently added)
4. **Product Recommendations** (similar, frequently bought together)
5. **Image Gallery** (multiple images per product)
6. **Bulk Actions** (admin: bulk import, pricing)
7. **Product Variants** (size, color, quantity)
8. **Social Sharing** (product links)

## Maintenance

**Last Updated**: 2026-05-12  
**Maintainer**: @team-frontend  
**Module Status**: ✅ Production Ready  
**Coverage**: 88.8% (ProductDetailPage), 96.4% (ProductCard), 93.3% (ProductGrid), 81.8% (ProductFilterBar)

## Support

For issues or questions:
1. Check existing tests for usage examples
2. Review store.productsStore.ts for state management
3. Check components for prop interfaces
4. See AGENTS.md for testing patterns
