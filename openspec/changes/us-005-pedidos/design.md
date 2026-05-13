## Context

El módulo de pedidos es el componente central del flujo de e-commerce. Permite convertir un carrito en un pedido real, gestionar el ciclo de vida mediante una máquina de estados finitos (FSM), garantizar atomicidad en las transacciones, y mantener un audit trail inmutable para trazabilidad.

**Estado actual:**
- us-001-auth: Completado (usuarios, JWT, RBAC)
- us-004-carrito: Completado (carrito con Zustand)
- us-008-direcciones: Pendiente o completado
- us-005-pedidos: Por implementar

**Restricciones técnicas:**
- PostgreSQL con SQLModel
- FastAPI con arquitectura en capas: Router → Service → UoW → Repository → Model
- Frontend con React + TypeScript + TanStack Query + Zustand
- Unit of Work para transacciones atómicas
- Snapshot pattern para datos volátiles

## Goals / Non-Goals

**Goals:**
- Implementar FSM con 6 estados y transiciones validadas
- Garantizar atomicidad en creación de pedidos (UoW)
- Implementar audit trail append-only en HistorialEstadoPedido
- Aplicar snapshot pattern para dirección y precios
- Crear endpoints REST para gestión completa de pedidos
- Integrar con pagos ( MercadoPago webhook avanza a CONFIRMADO)
- Mostrar pedidos del usuario en frontend

**Non-Goals:**
- Panel de gestión de pedidos para staff (fue diferido a us-007-admin, pero podemos incluir básico)
- Notificaciones en tiempo real (WebSocket)
- Gestión avanzada de inventario
- Reportes y analytics de pedidos

## Decisions

### D1: FSM en la capa de servicio, no en la base de datos

**Alternativas consideradas:**
- Trigger PostgreSQL con transición de estados
- Enum en Python sin validación centralizada

**Decisión:** Validar transiciones en `PedidoService` consultando la tabla `EstadoPedido` y el mapa de transiciones definido en código. La tabla sirve como catálogo consultable (`es_terminal`, `orden`), pero la lógica de negocio vive en Python.

**Justificación:** Mayor testabilidad, flexibilidad para cambiar transiciones sin modificar BD, trazabilidad mejor en logs de aplicación.

### D2: Snapshot en el momento de creación, no referencia

**Alternativas consideradas:**
- Referencia directa a Producto y DireccionEntrega
- JSONB con datos serializados

**Decisión:** Campos individuales (`nombre_snapshot`, `precio_snapshot`, `direccion_snapshot` como JSONB o texto serializado) directamente en las entidades.

**Justificación:** Consultas más simples (no requiere JOIN), consistencia inmutable garantizada, schema explícito con tipos definidos.

### D3: HistorialEstadoPedido append-only sin soft delete

**Alternativas consideradas:**
- Soft delete con `deleted_at`
- Tabla separadas para historial vs estado actual

**Decisión:** Solo INSERT, ningún UPDATE ni DELETE. El estado actual reside en `Pedido.estado_codigo`, el historial es solo consulta.

**Justificación:** Auditoría real, simplicidad, no hay necesidad de "borrar" un registro de auditoría.

### D4: INTEGER[] para personalización en DetallePedido

**Alternativas consideradas:**
- Tabla intermedia `PedidoPersonalizacion`
- JSONB

**Decisión:** Campo `personalizacion INTEGER[]` directamente en DetallePedido.

**Justificación:** Los ingredientes removidos son inmutables post-creación, operación de lectura como conjunto (no relaciones), schema explícito con validación de FK vía aplicación.

### D5: Costo de envío fijo en v1

**Alternativa considerada:**
- Calcular según distancia/peso

**Decisión:** `costo_envio` con default 50.00, hardcodeado en schema.

**Justificación:** Simplifica v1, no requiere integración con servicio de logística, se puede migrar a tabla de configuración más adelante.

## Risks / Trade-offs

- **[Risk] Race condition en stock**: Si dos pedidos se crean simultáneamente con el mismo producto, podría decrementarse más de lo disponible.
  - **Mitigation**: Usar `SELECT FOR UPDATE` en el repositorio al verificar stock, dentro de la transacción UoW.

- **[Risk] Webhook de MercadoPago duplicado**: MP puede enviar múltiples notificaciones del mismo pago.
  - **Mitigation**: Usar `idempotency_key` en tabla Pago, verificar si ya existe antes de procesar.

- **[Risk] Datos de dirección modificados después del pedido**: Si el usuario cambia o elimina la dirección, el pedido queda con referencia huérfana.
  - **Mitigation**: Snapshot completo (`direccion_snapshot` como JSON) al crear el pedido.

- **[Risk] Transiciones inválidas por concurrencia**: Dos operadores avanzan el mismo pedido simultáneamente.
  - **Mitigation**: La validación de FSM en servicio usa el estado actual de la DB; UoW garantiza aislamiento.

## Migration Plan

1. **Crear migración Alembic** para tablas: `estado_pedido`, `pedido`, `detalle_pedido`, `historial_estado_pedido`
2. **Ejecutar seed** para poblar `estado_pedido` con los 6 registros
3. **Crear modelos** en `app/models/`
4. **Crear repositorios** en `app/repositories/`
5. **Crear servicio** con lógica de FSM y UoW
6. **Crear router** con endpoints
7. **Crear frontend** (página pedidos + integración checkout)
8. **Verificar** con tests y manual

**Rollback:** Reversión de migración Alembic elimina todo. El seed se repueba al hacer upgrade.

## Open Questions

- ¿Se incluye el checkout completo en este change o se asume que us-006-pagos viene después? La propuesta asume integración básica pero el flujo completo de pago está en us-006.
- ¿El frontend incluye la página "Mis Pedidos" solo o también el drawer/timeline de estado?
- ¿Se implementa el botón de cancelar pedido para cliente (solo PENDIENTE)?