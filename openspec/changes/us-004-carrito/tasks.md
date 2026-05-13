# us-004-carrito - Implementation Tasks

## 1. Frontend - Cart Store Enhancement

- [ ] 1.1 Actualizar cartStore.ts para agregar validación de stock antes de agregar items
- [ ] 1.2 Agregar método `validateStock(productoId: number, cantidad: number)` al store
- [ ] 1.3 Agregar método `updateItemPersonalization(productoId: number, personalizacion: number[])` al store
- [ ] 1.4 Agregar error handling y estados de loading al store

## 2. Frontend - API Integration

- [ ] 2.1 Crear `features/cart/api.ts` con funciones para validar stock
- [ ] 2.2 Crear función `validateProductStock(productoId: number, cantidad: number): Promise<boolean>`
- [ ] 2.3 Integrar validación en los métodos addItem/updateQuantity del store

## 3. Frontend - Tipos TypeScript

- [ ] 3.1 Crear `features/cart/types.ts` con interfaces CartItem, CartState, CartActions
- [ ] 3.2 Tipar correctamente la personalización (array de ingredient IDs)
- [ ] 3.3 Exportar tipos para uso en componentes

## 4. Frontend - Componentes UI

- [ ] 4.1 Crear `features/cart/components/CartItem.tsx` - item individual del carrito
- [ ] 4.2 Crear `features/cart/components/CartSummary.tsx` - resumen de compra (subtotal, total)
- [ ] 4.3 Crear `features/cart/components/EmptyCart.tsx` - estado vacío
- [ ] 4.4 Crear `features/cart/components/CartPage.tsx` - página principal del carrito
- [ ] 4.5 Implementar diseño responsive (mobile-first)
- [ ] 4.6 Agregar controles de cantidad (+/-) y botón de eliminar

## 5. Frontend - Routing y Navigation

- [ ] 5.1 Actualizar App.tsx para incluir ruta `/cart` apuntando a CartPage
- [ ] 5.2 Actualizar navegación del Header para mostrar icono de carrito con badge de cantidad
- [ ] 5.3 Agregar ProtectedRoute al /cart (solo usuarios autenticados)

## 6. Frontend - Integración con Product Detail

- [ ] 6.1 Actualizar ProductDetailPage para incluir botón "Agregar al Carrito"
- [ ] 6.2 Mostrar selector de cantidad y opciones de personalización en la página de producto
- [ ] 6.3 Agregar validación de stock antes de permitir agregar

## 7. Frontend - Testing

- [ ] 7.1 Escribir tests unitarios para cartStore actualizado
- [ ] 7.2 Escribir tests para componentes CartItem, CartSummary
- [ ] 7.3 Escribir tests para CartPage
- [ ] 7.4 Testing de integración (carrito completo flujo)
- [ ] 7.5 Verificar cobertura > 70%

## 8. Frontend - Code Quality

- [ ] 8.1 Ejecutar ESLint y corregir errores
- [ ] 8.2 Ejecutar Prettier para formateo de código
- [ ] 8.3 Verificar compilación TypeScript sin errores
- [ ] 8.4 Crear README.md para el módulo cart

## 9. Git y Documentación

- [ ] 9.1 Crear rama `change/us-004-carrito`
- [ ] 9.2 Commits convencionales por cada tarea completada
- [ ] 9.3 Push de rama al remoto
- [ ] 9.4 Crear PR para code review

## 10. Verificación y Archive

- [ ] 10.1 Verificar tests en main después de merge
- [ ] 10.2 Verificar build exitoso
- [ ] 10.3 Manual testing del flujo completo
- [ ] 10.4 Archivar change con `openspec archive us-004-carrito`