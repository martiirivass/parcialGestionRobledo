# Cart Module

Módulo de gestión del carrito de compras para Food Store e-commerce.

## Descripción

El módulo cart proporciona funcionalidad completa para:
- Agregar productos al carrito con validación de stock
- Personalización de productos (exclusión de ingredientes)
- Persistencia del carrito en localStorage
- Actualización de cantidades y eliminación de items

## Estructura

```
src/features/cart/
├── api.ts                 # Funciones de API para validación de stock
├── types.ts               # TypeScript interfaces
├── store/
│   └── cartStore.ts      # Zustand store con persistencia
└── components/
    ├── CartPage.tsx      # Página principal del carrito
    ├── CartItem.tsx      # Componente de item individual
    ├── CartSummary.tsx   # Resumen de compra con totales
    ├── EmptyCart.tsx     # Estado cuando el carrito está vacío
    └── index.ts          # Barrel export
```

## Uso

### Importar el store

```typescript
import { useCartStore } from "./features/cart/store/cartStore";

// Agregar producto
await useCartStore.getState().addItem(producto, cantidad, personalizacion);

// Obtener total
const total = useCartStore.getState().getTotal();

// Obtener cantidad de items
const itemCount = useCartStore.getState().getItemCount();

// Limpiar carrito
useCartStore.getState().clearCart();
```

### Componentes

```typescript
import { CartPage, CartItem, CartSummary, EmptyCart } from "./features/cart/components";
```

## API

### validateProductStock(productoId: number, cantidad: number): Promise<boolean>

Valida que un producto tenga stock suficiente para la cantidad solicitada.

```typescript
const isValid = await validateProductStock(1, 5);
```

## Estado del Store

```typescript
interface CartState {
  items: CartItem[];           // Items en el carrito
  isLoading: boolean;          // Estado de carga
  error: string | null;       // Mensaje de error
}
```

## Características

- **Validación de stock**: Verifica disponibilidad antes de agregar items
- **Límite de items**: Máximo 50 items por carrito
- **Personalización**: Soporte para excluir ingredientes (alérgenos)
- **Persistencia**: El estado se guarda en localStorage
- **Diseño responsive**: Mobile-first con Tailwind CSS

## Testing

```bash
npm test -- --run tests/cartStore.test.ts
npm test -- --run tests/components/CartItem.test.tsx
npm test -- --run tests/components/CartSummary.test.tsx
```

## Dependencias

- Zustand (gestión de estado)
- Axios (HTTP client)
- React Router (navegación)
- Tailwind CSS (estilos)

## Notas

- El tipo `ProductPublic` del backend no expose `stock_cantidad`, por lo que se usa un valor máximo default de 10 para la validación
- La autenticación es requerida para acceder al carrito (ProtectedRoute)
- El checkout se implementa en us-005-pedidos