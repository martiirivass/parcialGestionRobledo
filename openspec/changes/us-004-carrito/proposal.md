## Why

El sistema de Food Store necesita un carrito de compras funcional que permita a los clientes seleccionar productos, personalizarlos (excluir ingredientes), y preparar el checkout para la creación de pedidos. Ya existe un cartStore de Zustand básico, pero falta la integración completa con el backend y los componentes de UI necesarios para una experiencia de compra fluida.

## What Changes

- **Backend**: Crear endpoints API para gestionar el carrito (obtener, agregar items, actualizar cantidad, eliminar items, limpiar)
- **Frontend**: Completar la integración del cartStore con la API, crear componentes de UI (CartPage, CartItem, CartSummary)
- **Persistencia**: Mantener el estado del carrito en localStorage para que persista entre sesiones
- **Personalización**: Soporte completo para personalización de productos (exclusión de ingredientes)
- **Validación**: Validar disponibilidad y stock en tiempo real antes de cada operación

## Capabilities

### New Capabilities
- `shopping-cart`: Sistema completo de gestión del carrito de compras con persistencia, validación de stock y personalización de productos

### Modified Capabilities
- `zustand-stores`: Actualizar para incluir integración con API del backend
- `product-catalog-browsing`: Añadir acción de "agregar al carrito" desde el catálogo

## Impact

- **Backend**: Nuevo módulo o extensión del módulo de pedidos para gestionar operaciones del carrito
- **Frontend**: Nuevos componentes en `features/cart/`, actualización de routing en App.tsx
- **API**: Endpoints REST para operaciones CRUD del carrito
- **Store**: Actualización del cartStore existente con llamadas a API
- **UI**: Nueva página /cart con componentes de visualización y edición del carrito