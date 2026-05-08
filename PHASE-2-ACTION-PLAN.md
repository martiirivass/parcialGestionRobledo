# 🚀 PHASE 2 ACTION PLAN: Frontend Implementation

**Status**: Ready to Start  
**Date**: 2026-05-08  
**Estimated Duration**: 4-6 hours  
**Tasks**: 6.1 → 8.2 (9 subtasks)

---

## 📋 Overview

Phase 1 (Backend & Database) is **COMPLETE** ✅. Phase 2 will implement the frontend to consume the category API endpoints and provide a hierarchical category browsing experience.

### Backend API Ready

The following endpoints are now available:

```
GET  /api/v1/categorias              - Get complete category tree (public, no auth)
POST /api/v1/categorias              - Create category (ADMIN/STOCK only)
GET  /api/v1/categorias/{id}         - Get category detail (ADMIN/STOCK only)
PUT  /api/v1/categorias/{id}         - Update category (ADMIN/STOCK only)
DELETE /api/v1/categorias/{id}       - Delete category (ADMIN/STOCK only)
```

Response format for public tree (GET /api/v1/categorias):
```json
[
  {
    "id": "uuid-1",
    "nombre": "Fruits",
    "padre_id": null,
    "subcategorias": [
      {
        "id": "uuid-2",
        "nombre": "Citrus",
        "padre_id": "uuid-1",
        "subcategorias": [
          { "id": "uuid-3", "nombre": "Oranges", "padre_id": "uuid-2", "subcategorias": [] }
        ]
      }
    ]
  }
]
```

---

## 🎯 PHASE 2 TASKS

### Task Group 6: Frontend State & API (Duration: 1-2h)

#### Task 6.1: Zustand Store for Category State

**Objective**: Create centralized state management for categories

**File**: `frontend/src/features/categorias/store/categoriasStore.ts`

**Deliverable**:
```typescript
interface CategoriasState {
  // State
  categories: CategoryTreeNode[];
  loading: boolean;
  error: string | null;
  selectedCategoryId: string | null;
  
  // Actions
  fetchCategories: () => Promise<void>;
  setSelectedCategory: (id: string | null) => void;
  reset: () => void;
}

export const useCategoriasStore = create<CategoriasState>((set) => ({
  // Implementation
}));
```

**Requirements**:
- ✅ Use Zustand for state management
- ✅ Fetch categories from `GET /api/v1/categorias` on mount
- ✅ Cache results (refetch only on manual refresh)
- ✅ Handle loading and error states
- ✅ Track selected category for filtering
- ✅ Integrate with existing auth store for token

**Success Criteria**:
- [ ] Store creates without errors
- [ ] `fetchCategories()` successfully retrieves tree from API
- [ ] State updates reactively in components
- [ ] Error handling works (network, malformed response)
- [ ] Categories persist across navigation

**Reference**:
- Existing auth store: `frontend/src/features/auth/store/authStore.ts`
- API client: `frontend/src/shared/api/client.ts`

---

#### Task 6.2: API Client Functions

**Objective**: Create API layer for category operations

**File**: `frontend/src/features/categorias/api.ts`

**Deliverable**:
```typescript
// Public endpoints (no auth)
export const fetchCategoryTree = async (): Promise<CategoryTreeNode[]> => {
  // GET /api/v1/categorias
};

// Protected endpoints (admin only)
export const createCategory = async (data: CategoryCreate): Promise<Category> => {
  // POST /api/v1/categorias
};

export const updateCategory = async (id: string, data: CategoryUpdate): Promise<Category> => {
  // PUT /api/v1/categorias/{id}
};

export const deleteCategory = async (id: string): Promise<void> => {
  // DELETE /api/v1/categorias/{id}
};

export const getCategoryDetail = async (id: string): Promise<Category> => {
  // GET /api/v1/categorias/{id}
};
```

**Requirements**:
- ✅ Use Axios client from `shared/api/client.ts`
- ✅ Include auth token for protected endpoints
- ✅ Handle error responses (400, 403, 404, 409)
- ✅ Type-safe with TypeScript
- ✅ Proper error messages for UX

**Error Handling**:
- 400 Bad Request → "Invalid data. Check fields."
- 403 Forbidden → "You don't have permission."
- 404 Not Found → "Category not found."
- 409 Conflict → "Duplicate name or has products."

**Success Criteria**:
- [ ] All 5 API functions created
- [ ] Functions handle auth correctly
- [ ] Error responses properly caught and typed
- [ ] Integration with store in 6.1

---

### Task Group 7: Frontend Components (Duration: 2-3h)

#### Task 7.1: Recursive CategoryTree Component

**Objective**: Build recursive React component for hierarchical display

**File**: `frontend/src/features/categorias/components/CategoryTree.tsx`

**Deliverable**:
```typescript
interface CategoryTreeProps {
  categories: CategoryTreeNode[];
  onSelectCategory?: (id: string) => void;
  selectedCategoryId?: string | null;
  expandable?: boolean;  // For collapsible tree
}

export const CategoryTree: React.FC<CategoryTreeProps> = ({
  categories,
  onSelectCategory,
  selectedCategoryId,
  expandable = true,
}) => {
  // Recursive rendering of tree
};

// Recursive sub-component
interface CategoryNodeProps {
  node: CategoryTreeNode;
  onSelectCategory?: (id: string) => void;
  selectedCategoryId?: string | null;
  expandable?: boolean;
  level?: number;  // For indentation
}

const CategoryNode: React.FC<CategoryNodeProps> = ({...}) => {
  // Individual node with children
};
```

**Requirements**:
- ✅ Recursively render `CategoryTreeNode` with `subcategorias`
- ✅ Support collapsible sections (expand/collapse)
- ✅ Highlight selected category
- ✅ Proper indentation for hierarchy levels
- ✅ Responsive design (mobile-friendly)
- ✅ Smooth animations on expand/collapse

**Features**:
- [ ] Expand/collapse state management
- [ ] Visual indicators (arrows, colors)
- [ ] Click to select category
- [ ] Keyboard navigation (Enter, ArrowDown, ArrowUp)
- [ ] Accessible (ARIA labels)

**Styling**: Use Tailwind CSS classes:
- Indent: `ml-4` per level
- Hover: `hover:bg-gray-100 cursor-pointer`
- Selected: `bg-blue-50 text-blue-600 font-semibold`
- Arrow animation: `transform transition-transform`

**Success Criteria**:
- [ ] Component renders tree correctly
- [ ] Expand/collapse works smoothly
- [ ] Selection state reflected in UI
- [ ] Mobile responsive
- [ ] No console errors

---

#### Task 7.2: Integration into Navbar/Homepage

**Objective**: Add category navigation to main UI

**Files**:
- `frontend/src/widgets/Header.tsx` - Category dropdown in navbar
- `frontend/src/pages/HomePage.tsx` - Category filter for products

**Navbar Dropdown**:
```typescript
// Add to Header component
<div className="relative group">
  <button className="...">Categories</button>
  <div className="hidden group-hover:block absolute left-0 top-full bg-white shadow-lg rounded">
    <CategoryTree categories={categories} onSelectCategory={handleSelect} />
  </div>
</div>
```

**Homepage Filter**:
```typescript
// Add to HomePage component
<aside className="w-64 bg-gray-50 p-4">
  <h3 className="font-bold mb-4">Filter by Category</h3>
  <CategoryTree 
    categories={categories} 
    onSelectCategory={handleCategoryFilter}
    selectedCategoryId={selectedCategory}
  />
</aside>
```

**Requirements**:
- ✅ Fetch categories on page load
- ✅ Show/hide dropdown on hover (desktop) and click (mobile)
- ✅ Display category count or product count per category
- ✅ Filter products when category selected
- ✅ Show breadcrumb trail of selected category

**Success Criteria**:
- [ ] Categories appear in navbar
- [ ] Dropdown works on desktop and mobile
- [ ] Category selection filters products
- [ ] Breadcrumb displays correctly
- [ ] UI is responsive

---

#### Task 7.3: Category Detail Page & Filters

**Objective**: Create dedicated category page with product filtering

**File**: `frontend/src/pages/CategoryDetailPage.tsx`

**Deliverable**:
```typescript
export const CategoryDetailPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const category = useCategoryDetail(categoryId);
  const products = useProductsByCategory(categoryId);
  
  return (
    <div>
      <h1>{category.nombre}</h1>
      <p>{category.descripcion}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sidebar: Subcategories */}
        <aside>
          <CategoryTree 
            categories={category.subcategorias} 
            onSelectCategory={handleSubcategorySelect}
          />
        </aside>
        
        {/* Main: Products */}
        <main className="md:col-span-2">
          <ProductGrid products={products} />
        </main>
      </div>
    </div>
  );
};
```

**Requirements**:
- ✅ Show parent and all subcategories
- ✅ Display products in selected category
- ✅ Sort/filter products (price, rating, etc.)
- ✅ Pagination for large product lists
- ✅ Breadcrumb navigation (Food > Fruits > Citrus)
- ✅ Show product count per category

**Features**:
- [ ] Breadcrumb: Home > Category > Subcategory
- [ ] Product count badge on categories
- [ ] Sort options: A-Z, Price Low→High, Rating
- [ ] Pagination with page size selector
- [ ] SEO meta tags

**Success Criteria**:
- [ ] Page loads category data correctly
- [ ] Products filter by selected category
- [ ] Breadcrumb navigable
- [ ] Sorting works
- [ ] Pagination works
- [ ] Responsive design

---

### Task Group 8: Frontend Tests (Duration: 1-2h)

#### Task 8.1: Unit Tests for Zustand Store

**Objective**: Test category state management logic

**File**: `frontend/src/features/categorias/store/__tests__/categoriasStore.test.ts`

**Test Cases**:
```typescript
describe('CategoriasStore', () => {
  // Initialization
  test('initializes with empty categories and loading false')
  
  // Fetching
  test('fetchCategories updates state with tree')
  test('fetchCategories sets loading to true while fetching')
  test('fetchCategories handles API errors')
  
  // Selection
  test('setSelectedCategory updates selectedCategoryId')
  test('setSelectedCategory can be reset to null')
  
  // Reset
  test('reset clears all state')
  
  // Caching
  test('does not refetch if categories already loaded')
});
```

**Mocking**:
- Mock API client with `jest.mock()`
- Mock successful responses
- Mock error responses (400, 403, 404, 409)

**Coverage Target**: 100% of store methods

**Success Criteria**:
- [ ] All test cases pass
- [ ] 100% code coverage for store
- [ ] Error handling tested
- [ ] State updates verified

---

#### Task 8.2: Component Tests

**Objective**: Test React components

**Test Files**:
- `frontend/src/features/categorias/components/__tests__/CategoryTree.test.tsx`
- `frontend/src/widgets/__tests__/Header.test.tsx`
- `frontend/src/pages/__tests__/CategoryDetailPage.test.tsx`

**CategoryTree Tests**:
```typescript
describe('CategoryTree', () => {
  // Rendering
  test('renders list of categories')
  test('renders subcategories when expanded')
  test('renders empty state when no categories')
  
  // Interaction
  test('expands/collapses on click')
  test('calls onSelectCategory when node clicked')
  test('highlights selected category')
  
  // Accessibility
  test('has aria-labels')
  test('keyboard navigation works')
});
```

**Header Tests**:
```typescript
describe('Header', () => {
  test('shows category dropdown on hover')
  test('categories appear from store')
  test('clicking category filters products')
});
```

**CategoryDetailPage Tests**:
```typescript
describe('CategoryDetailPage', () => {
  test('loads category by ID from URL')
  test('loads products for category')
  test('breadcrumb navigation works')
  test('filtering by subcategory works')
});
```

**Mocking**:
- Mock Zustand store with `useCategoriasStore`
- Mock React Router `useParams`
- Mock API calls

**Coverage Target**: 80%+ for components

**Success Criteria**:
- [ ] All component tests pass
- [ ] Interactions work correctly
- [ ] Mocks are accurate
- [ ] Coverage above target

---

## 📝 Implementation Checklist

### Before Starting
- [ ] Read `openspec/changes/us-002-categorias/design.md` section "Frontend Architecture"
- [ ] Review existing Zustand stores in `features/auth/store/`
- [ ] Review API client patterns in `shared/api/`
- [ ] Check TanStack Query usage for caching (if needed)

### 6.1 - Zustand Store
- [ ] Create `frontend/src/features/categorias/store/categoriasStore.ts`
- [ ] Define `CategoriasState` interface with all state and actions
- [ ] Implement `fetchCategories()` to call API
- [ ] Implement selection tracking
- [ ] Export hook `useCategoriasStore`
- [ ] Test in React DevTools

### 6.2 - API Client
- [ ] Create `frontend/src/features/categorias/api.ts`
- [ ] Implement all 5 API functions
- [ ] Add proper error handling
- [ ] Type all responses
- [ ] Test with Postman/curl

### 7.1 - CategoryTree Component
- [ ] Create `CategoryTree.tsx` with recursive logic
- [ ] Implement expand/collapse state
- [ ] Style with Tailwind
- [ ] Add keyboard navigation
- [ ] Test rendering with mock data

### 7.2 - Navbar Integration
- [ ] Add category dropdown to `Header.tsx`
- [ ] Connect to store for live data
- [ ] Implement hover/click behavior
- [ ] Add breadcrumb
- [ ] Test on mobile

### 7.3 - Category Detail Page
- [ ] Create `CategoryDetailPage.tsx`
- [ ] Add sidebar with subcategories
- [ ] Add main product grid
- [ ] Implement sorting/filtering
- [ ] Add pagination

### 8.1 - Store Tests
- [ ] Create test file
- [ ] Mock API client
- [ ] Write 8+ test cases
- [ ] Achieve 100% coverage
- [ ] Run: `npm test`

### 8.2 - Component Tests
- [ ] Create test files for 3 components
- [ ] Write 10+ test cases total
- [ ] Mock stores and routing
- [ ] Achieve 80%+ coverage
- [ ] Run: `npm test`

---

## 🔗 Dependencies & References

### Frontend Architecture (from design.md)

```
features/categorias/
├── api.ts                    ← Task 6.2
├── components/
│   ├── CategoryTree.tsx      ← Task 7.1
│   └── __tests__/
│       └── CategoryTree.test.tsx  ← Task 8.2
├── store/
│   ├── categoriasStore.ts    ← Task 6.1
│   └── __tests__/
│       └── categoriasStore.test.ts ← Task 8.1
└── types.ts                  (CategoryTreeNode interface)

widgets/
├── Header.tsx                ← Task 7.2 (modify existing)
└── __tests__/
    └── Header.test.tsx       ← Task 8.2

pages/
├── CategoryDetailPage.tsx    ← Task 7.3 (new)
└── __tests__/
    └── CategoryDetailPage.test.tsx ← Task 8.2
```

### TypeScript Types

```typescript
// From backend CategoryResponse
interface Category {
  id: string;
  nombre: string;
  padre_id: string | null;
  creado_en: string;
  actualizado_en: string;
  eliminado_en: string | null;
}

// Nested tree response
interface CategoryTreeNode extends Category {
  subcategorias: CategoryTreeNode[];
}

// For creating/updating
interface CategoryCreate {
  nombre: string;
  padre_id?: string | null;
}

interface CategoryUpdate {
  nombre?: string;
  padre_id?: string | null;
}
```

### Existing Patterns to Follow

**Zustand Store** (from `features/auth/store/authStore.ts`):
- Use `create<T>()` with zustand
- Persist tokens in localStorage if needed
- Handle loading/error states

**API Client** (from `shared/api/client.ts`):
- Use Axios instance with interceptors
- Add token to Authorization header
- Handle network errors

**Components** (from existing features):
- Use React.FC<Props> type
- Export for testing
- Use Tailwind for styling

---

## ✅ Success Criteria for Phase 2

- [x] **Zustand Store**: Fetches categories, manages state, no errors
- [x] **API Client**: All 5 functions work, errors handled
- [x] **CategoryTree**: Renders tree, expand/collapse works, responsive
- [x] **Navbar**: Categories dropdown visible, selection works
- [x] **Homepage**: Category filter visible and functional
- [x] **Category Detail Page**: Loads category, shows products, breadcrumb works
- [x] **Store Tests**: 8+ test cases, 100% coverage
- [x] **Component Tests**: 10+ test cases, 80%+ coverage
- [x] **No TypeScript Errors**: `npm run build` passes
- [x] **Linting Passes**: `npm run lint` passes
- [x] **Formatting**: `npm run format` passes

---

## 📊 Metrics

| Component | LOC Est. | Files | Tests |
|-----------|----------|-------|-------|
| Zustand Store | 80-100 | 1 | 8+ |
| API Client | 60-80 | 1 | 5 |
| CategoryTree | 120-150 | 1 | 6+ |
| Navbar Mod | 50-100 | 1 | 4 |
| Detail Page | 150-200 | 1 | 4+ |
| Tests | 300-400 | 4 | 28+ |
| **Total** | **760-1030** | **9** | **55+** |

---

## 🚀 Next Phase

After Phase 2 completes:
1. **Phase 3**: Quality & Deployment (2-3h)
   - Manual testing (Postman + browser)
   - Code quality checks
   - PR creation and merge
   - Archive with openspec

2. **Success**: Categories fully implemented across backend + frontend ✅

---

## 📝 Notes

- Backend API is stable and tested
- Public endpoint (GET /api/v1/categorias) requires NO authentication
- All protected endpoints require ADMIN or STOCK role
- Tests should mock API calls (no real requests)
- Use TanStack Query if caching/refetching is complex
- Accessibility is important (ARIA labels, keyboard nav)

---

**Phase 2 Ready to Start** 🟢

All dependencies from Phase 1 are complete. You can proceed with tasks 6.1 → 8.2 immediately.
