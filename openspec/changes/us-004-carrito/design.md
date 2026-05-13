## Context

Food Store es un e-commerce de productos alimenticios que necesita un sistema de carrito de compras funcional. Ya existe un `cartStore` de Zustand en `frontend/src/features/cart/store/cartStore.ts` que gestiona el estado del cliente con persistencia en localStorage. Este store soporta:
- Agregar items con producto, cantidad y personalización
- Actualizar/remover items
- Cálculo de total e item count
- Persistencia automática

Sin embargo, faltan:
1. Integración con la API del backend
2. Componentes de UI para la página del carrito
3. Validación de disponibilidad/stock en tiempo real
4. Sincronización con el catálogo de productos

## Goals / Non-Goals

**Goals:**
- Completar la integración del cartStore con los endpoints de API del backend
- Crear la página del carrito (CartPage) con componentes de visualización
- Implementar validación de stock en tiempo real (verificar disponibilidad antes de cada operación)
- Soportar personalización de productos (exclusión de ingredientes)
- Crear resumen de compra con totales desglosados
- Integrar "agregar al carrito" desde la página de detalle de producto

**Non-Goals:**
- Implementar el proceso de checkout (pertenece a us-005-pedidos)
- Integrar con MercadoPago (pertenece a us-006-pagos)
- Gestión de direcciones de entrega (pertenece a us-008-direcciones)
- Panel de admin para ver carritos de otros usuarios

## Decisions

### D1: Carrito gestionado en cliente (no hay endpoint POST /carrito)
**Rationale**: El carrito es estado efímero del cliente. Solo se crea el pedido cuando el usuario confirma la compra. Esto evita problemas de consistencia y reduce carga en el servidor.

**Alternatives considered**:
- Guardar carrito en backend: Agrega complejidad, requiere sincronización entre dispositivos, mayor carga de servidor

### D2: Validación de stock en tiempo real
**Rationale**: El stock puede cambiar entre el momento de agregar al carrito y el checkout. Validar antes de cada operación mejora la UX.

**Implementation**: Llamar GET /productos/{id} antes de agregar/actualizar para verificar stock_cantidad >= cantidad_solicitada y disponible=true.

### D3: Persistencia en localStorage mediante Zustand persist middleware
**Rationale**: Ya implementado en el store existente. Mantiene la experiencia del usuario entre sesiones del navegador.

**Alternatives considered**:
- SessionStorage: Menos persistente, perdido al cerrar navegador
- Cookies: Menor capacidad, overkill para este caso de uso

### D4: Arquitectura de componentes frontend
**Pattern**: Feature-Sliced Design (FSD) ya establecido en el proyecto.

**Estructura propuesta**:
```
frontend/src/features/cart/
├── api.ts              # Funciones de llamada a API
├── components/
│   ├── CartPage.tsx    # Página principal del carrito
│   ├── CartItem.tsx    # Item individual del carrito
│   ├── CartSummary.tsx # Resumen de compra (total, items)
│   └── EmptyCart.tsx   # Estado cuando no hay items
├── types.ts            # Tipos TypeScript
└── store/cartStore.ts  # Ya existe, agregar integración API
```

### D5: API del backend - Endpoints necesarios
Basado en la arquitectura existente del proyecto, el carrito no requiere endpoints dedicados. Las operaciones del carrito son:
- **GET /productos/{id}**: Para validar stock antes de agregar
- **POST /pedidos**: Para convertir el carrito en pedido (pertenece a us-005)

El frontend validará stock consultando directamente los endpoints de productos existentes.

## Risks / Trade-offs

- **[Riesgo]** Stock desactualizado entre validación y checkout → **Mitigación**: Re-validar stock al intentar crear el pedido (us-005)
- **[Riesgo]** Carrito muy grande (miles de items) puede afectar performance → **Mitigación**: Limitar cantidad máxima de items (ej: 50)
- **[Trade-off]** Persistencia en localStorage se pierde si el usuario limpia cookies → **Mitigación**: Mostrar mensaje de "carrito guardado" al agregar items
- **[Trade-off]** No hay sincronización entre dispositivos → **Mitigación**: En fase posterior (v2) implementar cuenta con carrito sincronizado

## Migration Plan

**Fase 1 - Backend (no requerido)**
- No se requieren nuevos endpoints de API para el carrito
- Solo se usan endpoints existentes de productos para validación

**Fase 2 - Frontend Store**
- Actualizar `cartStore.ts` para integrar llamadas a API
- Agregar métodos de validación de stock

**Fase 3 - Componentes UI**
- Crear componentes en `features/cart/components/`
- Actualizar App.tsx para incluir /cart route
- Integrar "agregar al carrito" en ProductDetailPage

**Fase 4 - Testing**
- Tests unitarios del store actualizado
- Tests de componentes del carrito
- Tests de integración (validación de stock)

## Open Questions

- ¿Debe mostrarse un badge con la cantidad de items en el ícono del carrito en el header?
- ¿Se debe permitir editar la personalización de un item desde el carrito?
- ¿Cuál es el comportamiento esperado si el usuario agrega un producto que ya está en el carrito? (actualmente suma cantidades)