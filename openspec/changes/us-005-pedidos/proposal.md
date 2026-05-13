## Why

El sistema de pedidos es el corazón del flujo de e-commerce. Sin él, los usuarios no pueden completar compras, el negocio no puede operar, y no hay forma de rastrear el estado de las órdenes. El carrito (us-004) ya permite seleccionar productos, pero falta el paso crítico: convertir ese carrito en un pedido real con gestión de estados, atomicidad en la transacción, y trazabilidad completa.

## What Changes

- **Nuevo módulo de Pedidos**: Entidades Pedido, DetallePedido, HistorialEstadoPedido, EstadoPedido (catálogo)
- **Máquina de Estados (FSM)**: 6 estados (PENDIENTE → CONFIRMADO → EN_PREPARACIÓN → EN_CAMINO → ENTREGADO/CANCELADO) con transiciones controladas
- **Unit of Work**: Transacciones atómicas para creación de pedidos y decremento de stock
- **Audit Trail**: HistorialEstadoPedido registra cada transición de estado (append-only, inmutable)
- **Snapshots**: Copia de datos volátiles (dirección, precios) al momento de creación del pedido
- **Endpoints API**: CRUD de pedidos, transición de estados, consulta de historial
- **Frontend**: Página de pedidos del usuario, panel de gestión para staff (opcional en fase 1)

## Capabilities

### New Capabilities
- `order-management`: Sistema completo de gestión de pedidos con FSM, atomicidad y audit trail. Incluye modelos, servicios, repositorios, endpoints y frontend básico.

### Modified Capabilities
- `zustand-stores`: Extender con store para gestionar pedidos del usuario (listado, detalle, historial de estados)
- `database-schema`: Agregar tablas pedido, detalle_pedido, historial_estado_pedido, estado_pedido
- `seed-data`: Agregar registros para tabla estado_pedido (6 estados)

## Impact

- **Backend**: Nuevo módulo `app/pedidos/` con router, schemas, service, enums
- **Backend**: Nuevo módulo `app/repositories/order_repository.py`
- **Database**: Nuevas tablas mediante Alembic migrations
- **Frontend**: Nueva página de pedidos, integración con checkout
- **Dependencias**: Requiere us-001-auth (usuarios), us-004-carrito (carrito completado), us-008-direcciones (direcciones)