# us-004-carrito - Implementation Tasks

## 1. Frontend - Cart Store Enhancement

- [x] 1.1 Actualizar cartStore.ts para agregar validación de stock antes de agregar items
- [x] 1.2 Agregar método `validateStock(productoId: number, cantidad: number)` al store
- [x] 1.3 Agregar método `updateItemPersonalization(productoId: number, personalizacion: number[])` al store
- [x] 1.4 Agregar error handling y estados de loading al store

## 2. Frontend - API Integration

- [x] 2.1 Crear `features/cart/api.ts` con funciones para validar stock
- [x] 2.2 Crear función `validateProductStock(productoId: number, cantidad: number): Promise<boolean>`
- [x] 2.3 Integrar validación en los métodos addItem/updateQuantity del store

## 3. Frontend - Tipos TypeScript

- [x] 3.1 Crear `features/cart/types.ts` con interfaces CartItem, CartState, CartActions
- [x] 3.2 Tipar correctamente la personalización (array de ingredient IDs)
- [x] 3.3 Exportar tipos para uso en componentes

## 4. Frontend - Componentes UI

- [x] 4.1 Crear `features/cart/components/CartItem.tsx` - item individual del carrito
- [x] 4.2 Crear `features/cart/components/CartSummary.tsx` - resumen de compra (subtotal, total)
- [x] 4.3 Crear `features/cart/components/EmptyCart.tsx` - estado vacío
- [x] 4.4 Crear `features/cart/components/CartPage.tsx` - página principal del carrito
- [x] 4.5 Implementar diseño responsive (mobile-first)
- [x] 4.6 Agregar controles de cantidad (+/-) y botón de eliminar

## 5. Frontend - Routing y Navigation

- [x] 5.1 Actualizar App.tsx para incluir ruta `/cart` apuntando a CartPage
- [x] 5.2 Actualizar navegación del Header para mostrar icono de carrito con badge de cantidad
- [x] 5.3 Agregar ProtectedRoute al /cart (solo usuarios autenticados)

## 6. Frontend - Integración con Product Detail

- [x] 6.1 Actualizar ProductDetailPage para incluir botón "Agregar al Carrito"
- [x] 6.2 Mostrar selector de cantidad y opciones de personalización en la página de producto
- [x] 6.3 Agregar validación de stock antes de permitir agregar

## 7. Frontend - Testing

- [ ] 7.1 Escribir tests unitarios para cartStore actualizado
- [ ] 7.2 Escribir tests para componentes CartItem, CartSummary
- [ ] 7.3 Escribir tests para CartPage
- [ ] 7.4 Testing de integración (carrito completo flujo)
- [ ] 7.5 Verificar cobertura > 70%

## 8. Frontend - Code Quality

- [x] 8.1 Ejecutar ESLint y corregir errores
- [x] 8.2 Ejecutar Prettier para formateo de código
- [x] 8.3 Verificar compilación TypeScript sin errores
- [ ] 8.4 Crear README.md para el módulo cart

## 9. Git y Documentación

- [x] 9.1 Crear rama `change/us-004-carrito`
- [x] 9.2 Commits convencionales por cada tarea completada
- [ ] 9.3 Push de rama al remoto
- [ ] 9.4 Crear PR para code review

## 10. Verificación y Archive

- [ ] 10.1 Verificar tests en main después de merge
- [ ] 10.2 Verificar build exitoso
- [ ] 10.3 Manual testing del flujo completo
- [ ] 10.4 Archivar change con `openspec archive us-004-carrito`