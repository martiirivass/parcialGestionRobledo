# Order Management Specification

## ADDED Requirements

### Requirement: Sistema de gestión de pedidos

El sistema SHALL permitir la creación, seguimiento y gestión del ciclo de vida de pedidos de compra, con validación de transiciones de estado, atomicidad en transacciones, y trazabilidad completa.

#### Scenario: Cliente crea un pedido desde el carrito
- **WHEN** el cliente envía POST /api/v1/pedidos con items del carrito, dirección y forma de pago
- **THEN** el sistema crea un pedido en estado PENDIENTE con snapshot de precios, dirección y total; inicializa historial con estado_desde=NULL; persiste todo atómicamente

#### Scenario: Cliente lista sus pedidos
- **WHEN** el cliente autenticado envía GET /api/v1/pedidos
- **THEN** el sistema retorna solo los pedidos belonging al usuario, paginados, con estado actual y total

#### Scenario: Cliente visualiza detalle de un pedido
- **WHEN** el cliente envía GET /api/v1/pedidos/{id}
- **THEN** el sistema retorna: pedido completo, items con snapshots, historial de estados en orden cronológico, estado del pago

#### Scenario: Gestor de Pedidos avanza estado del pedido
- **WHEN** el gestor envía PATCH /api/v1/pedidos/{id}/estado con nuevo estado válido según FSM
- **THEN** el sistema valida la transición, actualiza Pedido.estado_codigo, inserta registro en HistorialEstadoPedido; si es CONFIRMADO→CANCELADO, restaura stock atómicamente

#### Scenario: Cliente cancela su propio pedido
- **WHEN** el cliente envía DELETE /api/v1/pedidos/{id} en estado PENDIENTE o CONFIRMADO
- **THEN** el sistema verifica propiedad y estado válido; si CONFIRMADO, restaura stock; actualiza estado a CANCELADO e inserta historial

#### Scenario: Webhook de MercadoPago confirma pago
- **WHEN** MercadoPago envía POST /api/v1/pagos/webhook con topic=payment y status=approved
- **THEN** el sistema valida idempotency_key, actualiza tabla Pago, avanza pedido a CONFIRMADO, decrementa stock de productos

---

### Requirement: Máquina de Estados Finitos (FSM)

El sistema SHALL validar todas las transiciones de estado contra el mapa de transiciones permitidas, rechazando cualquier transición inválida.

#### Scenario: Transición válida PENDIENTE → CONFIRMADO
- **WHEN** el sistema recibe solicitud de avanzar de PENDIENTE a CONFIRMADO
- **THEN** la transición es permitida; se actualiza el estado y se registra en historial

#### Scenario: Transición inválida (salto)
- **WHEN** el sistema recibe solicitud de avanzar de PENDIENTE directamente a EN_CAMINO
- **THEN** el sistema rechaza con HTTP 400 y mensaje "Transición no permitida: de PENDIENTE a EN_CAMINO"

#### Scenario: Transición a estado terminal ENTREGADO
- **WHEN** el gestor envía avanzar de EN_CAMINO a ENTREGADO
- **THEN** el sistema permite la transición; el pedido queda en estado terminal sin más transiciones posibles

#### Scenario: Intento de transición desde estado terminal
- **WHEN** se intenta avanzar desde ENTREGADO o CANCELADO a cualquier otro estado
- **THEN** el sistema rechaza con HTTP 400 y mensaje "El pedido ya está en estado terminal"

#### Scenario: Cancelación desde EN_PREPARACIÓN por no-admin
- **WHEN** un cliente intenta cancelar un pedido en EN_PREPARACIÓN
- **THEN** el sistema rechaza con HTTP 403 (solo Admin puede cancelar en este estado según RN-08)

---

### Requirement: Unit of Work - Atomicidad en creación

El sistema SHALL ejecutar la creación de pedidos como transacción atómica: si cualquier parte falla, todo se revierte.

#### Scenario: Creación exitosa
- **WHEN** el cliente envía pedido válido con stock suficiente
- **THEN** se ejecutan: INSERT Pedido, INSERT DetallePedido (N), INSERT HistorialEstadoPedido, COMMIT; todo persiste

#### Scenario: Fallo por stock insuficiente
- **WHEN** el cliente envía pedido pero un producto no tiene stock al momento de crear
- **THEN** el sistema lanza error, ROLLBACK, ningún pedido ni detalle se persiste

#### Scenario: Fallo por error de base de datos
- **WHEN** ocurre error de conexión durante la creación del pedido
- **THEN** el sistema captura la excepción, ejecuta ROLLBACK, retorna error 500 con mensaje genérico

---

### Requirement: Snapshot Pattern

El sistema SHALL capturar una copia inmutable de datos volátiles al momento de crear el pedido.

#### Scenario: Snapshot de precios
- **WHEN** se crea un detalle de pedido
- **THEN** el sistema almacena precio_snapshot = precio_base actual del producto; este valor nunca cambia aunque el producto actualice su precio

#### Scenario: Snapshot de nombre de producto
- **WHEN** se crea un detalle de pedido
- **THEN** el sistema almacena nombre_snapshot = nombre actual del producto; persiste aunque el producto se renombre o elimine

#### Scenario: Snapshot de dirección
- **WHEN** se crea un pedido con dirección_id
- **THEN** el sistema serializa la dirección en direccion_snapshot (JSON); persiste aunque el usuario modifique o elimine la dirección original

#### Scenario: Cálculo de total con snapshots
- **WHEN** se calcula el total de un pedido
- **THEN** el sistema suma: (precio_snapshot × cantidad) de cada detalle + costo_envio; los precios snapshot no se recalculan

---

### Requirement: Audit Trail Append-Only

El sistema SHALL registrar cada transición de estado en HistorialEstadoPedido como un registro inmutable, nunca modificado ni eliminado.

#### Scenario: Primer registro de historial (estado inicial)
- **WHEN** se crea un nuevo pedido
- **THEN** se inserta HistorialEstadoPedido con estado_desde=NULL, estado_hacia=PENDIENTE, usuario_id=propietario

#### Scenario: Transición de estado subsecuente
- **WHEN** el gestor avanza el pedido de EN_PREPARACIÓN a EN_CAMINO
- **THEN** se inserta nuevo registro con estado_desde=EN_PREPARACIÓN, estado_hacia=EN_CAMINO, usuario_id del gestor

#### Scenario: Consulta de historial completo
- **WHEN** se solicita GET /api/v1/pedidos/{id}/historial
- **THEN** el sistema retorna todos los registros ordenados por created_at ASC (cronológico)

#### Scenario: Intento de modificar historial
- **WHEN** se intenta UPDATE o DELETE en HistorialEstadoPedido
- **THEN** la operación es rechazada a nivel de aplicación (no hay endpoint para esto)

---

### Requirement: Decremento y restauración de stock

El sistema SHALL modificar el stock de productos de forma atómica al confirmar o cancelar pedidos.

#### Scenario: Decremento de stock al confirmar
- **WHEN** un pedido transiciona de PENDIENTE a CONFIRMADO
- **THEN** para cada DetallePedido, el sistema decrementa Producto.stock_cantidad por la cantidad pedida; todo en la misma transacción

#### Scenario: Stock insuficiente al confirmar
- **WHEN** al confirmar un pedido, un producto tiene stock menor a la cantidad solicitada
- **THEN** el sistema lanza error, revierte toda la transacción, el pedido permanece en PENDIENTE

#### Scenario: Restauración de stock al cancelar
- **WHEN** un pedido confirmado se cancela (CONFIRMADO → CANCELADO)
- **THEN** el sistema incrementa Producto.stock_cantidad por las cantidades de cada detalle; stock restaurado

#### Scenario: Cancelación desde PENDIENTE no restaura stock
- **WHEN** un pedido en PENDIENTE se cancela
- **THEN** no se ejecuta ninguna modificación de stock (nunca fue decrementado)

---

### Requirement: Endpoints REST para pedidos

El sistema SHALL exponer los siguientes endpoints conforme a la especificación de API.

| Método | Ruta | Descripción | Roles | Respuesta |
|--------|------|--------------|-------|-----------|
| GET | /api/v1/pedidos | Listar pedidos del usuario | CLIENT | 200 PaginatedPedidos |
| GET | /api/v1/pedidos/{id} | Detalle del pedido | Propietario/ADMIN/PEDIDOS | 200 PedidoDetail |
| POST | /api/v1/pedidos | Crear pedido desde carrito | CLIENT | 201 PedidoRead |
| PATCH | /api/v1/pedidos/{id}/estado | Avanzar estado | ADMIN/PEDIDOS | 200 PedidoRead |
| GET | /api/v1/pedidos/{id}/historial | Ver historial | Propietario/ADMIN | 200 List[HistorialRead] |
| DELETE | /api/v1/pedidos/{id} | Cancelar pedido | CLIENT (PENDIENTE/CONFIRMADO), ADMIN | 200 PedidoRead |

#### Scenario: Listar pedidos con paginación
- **WHEN** cliente envía GET /api/v1/pedidos?skip=0&limit=10
- **THEN** retorna array de PedidoRead con total count en header X-Total-Count

#### Scenario: Crear pedido con items inválidos
- **WHEN** cliente envía POST /api/v1/pedidos con producto_id que no existe
- **THEN** retorna 404 con mensaje "Producto no encontrado"

---

### Requirement: Frontend - Página Mis Pedidos

El sistema SHALL mostrar al cliente una lista de sus pedidos con estado actual y возможность de ver detalles.

#### Scenario: Cliente ve lista de pedidos
- **WHEN** el usuario navega a /pedidos
- **THEN** la aplicación muestra lista de pedidos con: ID, fecha, estado, total; clickeable para ver detalle

#### Scenario: Cliente ve detalle de un pedido
- **WHEN** el usuario hace click en un pedido de la lista
- **THEN** la aplicación muestra: items con nombres y precios snapshot, historial de estados como timeline, estado del pago

#### Scenario: Timeline de estados
- **WHEN** el usuario visualiza el historial de un pedido
- **THEN** se muestra línea de tiempo vertical con cada transición: estado, fecha, usuario que ejecutó (si aplica)

---

### Requirement: Integración con Checkout

El sistema SHALL permitir que el flujo de checkout del carrito cree un pedido automáticamente.

#### Scenario: Checkout desde carrito
- **WHEN** el cliente completa el checkout (selecciona dirección, forma de pago, confirma)
- **THEN** el frontend envía los items del carrito al endpoint POST /api/v1/pedidos; al recibir respuesta, limpia el carrito

#### Scenario: Redirección post-creación de pedido
- **WHEN** el pedido se crea exitosamente
- **THEN** el frontend redirige al usuario a la página de detalle del pedido (/pedidos/{id})

#### Scenario: Pedido requiere pago
- **WHEN** el pedido se crea con forma_pago_codigo=MERCADOPAGO
- **THEN** el sistema deja el pedido en PENDIENTE; el frontend inicia el flujo de pago con MercadoPago SDK

---

## Non-Goals (Explicit Out of Scope)

- Panel de gestión avanzada de pedidos para staff (más allá de avanzar estados básico)
- Notificaciones en tiempo real (WebSocket) para cambios de estado
- Reportes y analytics de pedidos
- Integración con sistemas de logística externos
- Descuentos, cupones y promociones
- Gestión de múltiples pedidos en una sola entrega