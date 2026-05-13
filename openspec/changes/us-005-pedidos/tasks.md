## 1. Base de Datos - Migraciones y Modelos

- [ ] 1.1 Crear migración Alembic para tabla `estado_pedido` (catálogo)
- [ ] 1.2 Crear migración Alembic para tabla `pedido`
- [ ] 1.3 Crear migración Alembic para tabla `detalle_pedido`
- [ ] 1.4 Crear migración Alembic para tabla `historial_estado_pedido`
- [ ] 1.5 Ejecutar migración: `alembic upgrade head`
- [ ] 1.6 Crear modelo SQLModel `EstadoPedido` en `app/models/`
- [ ] 1.7 Crear modelo SQLModel `Pedido` en `app/models/`
- [ ] 1.8 Crear modelo SQLModel `DetallePedido` en `app/models/`
- [ ] 1.9 Crear modelo SQLModel `HistorialEstadoPedido` en `app/models/`

## 2. Seed Data

- [ ] 2.1 Ejecutar seed para poblar `estado_pedido` con los 6 estados: PENDIENTE, CONFIRMADO, EN_PREPARACIÓN, EN_CAMINO, ENTREGADO, CANCELADO (con es_terminal)
- [ ] 2.2 Verificar que el seed se ejecutó correctamente

## 3. Repositorios

- [ ] 3.1 Crear `app/repositories/pedido_repository.py` con métodos: create, get_by_id, get_by_user, update_estado
- [ ] 3.2 Crear `app/repositories/detalle_pedido_repository.py` con métodos: create_many, get_by_pedido
- [ ] 3.3 Crear `app/repositories/historial_estado_repository.py` con métodos: create, get_by_pedido
- [ ] 3.4 Implementar `SELECT FOR UPDATE` para validación de stock

## 4. Capa de Servicio - Lógica de Negocio

- [ ] 4.1 Crear `app/pedidos/enums.py` con definición de estados y transiciones válidas (mapa FSM)
- [ ] 4.2 Crear `app/pedidos/service.py` con lógica de:
  - crear_pedido (con UoW, snapshots, validación de stock)
  - listar_pedidos (por usuario, paginado)
  - obtener_pedido (con detalles e historial)
  - cambiar_estado (validación FSM, decremento/restauración de stock)
  - cancelar_pedido (cliente)
  - obtener_historial
- [ ] 4.3 Implementar validación de transiciones FSM contra el mapa de estados
- [ ] 4.4 Implementar decremento de stock atómico al confirmar
- [ ] 4.5 Implementar restauración de stock al cancelar pedido confirmado

## 5. Capa Router - Endpoints API

- [ ] 5.1 Crear `app/pedidos/schemas.py` con:
  - CrearPedidoRequest, ItemPedidoRequest
  - PedidoRead, PedidoDetail, DetallePedidoRead
  - CambiarEstadoRequest, HistorialRead
- [ ] 5.2 Crear `app/pedidos/router.py` con endpoints:
  - GET /pedidos (listar)
  - GET /pedidos/{id} (detalle)
  - POST /pedidos (crear)
  - PATCH /pedidos/{id}/estado (avanzar)
  - GET /pedidos/{id}/historial (ver historial)
  - DELETE /pedidos/{id} (cancelar)
- [ ] 5.3 Registrar router en `app/main.py` (incluir /api/v1/pedidos prefix)
- [ ] 5.4 Agregar validación de roles (CLIENT para creación, ADMIN/PEDIDOS para avanzar estados)

## 6. Frontend - Página Mis Pedidos

- [ ] 6.1 Crear `frontend/src/features/pedidos/api.ts` con llamadas a endpoints
- [ ] 6.2 Crear `frontend/src/features/pedidos/types.ts` con interfaces TypeScript
- [ ] 6.3 Crear `frontend/src/features/pedidos/components/PedidosList.tsx` (lista de pedidos)
- [ ] 6.4 Crear `frontend/src/features/pedidos/components/PedidoDetail.tsx` (detalle con items y total)
- [ ] 6.5 Crear `frontend/src/features/pedidos/components/HistorialTimeline.tsx` (timeline de estados)
- [ ] 6.6 Crear `frontend/src/pages/PedidosPage.tsx` (página principal)
- [ ] 6.7 Agregar ruta en React Router: /pedidos
- [ ] 6.8 Actualizar header para incluir link a "Mis Pedidos"

## 7. Integración con Checkout

- [ ] 7.1 Modificar checkout para llamar POST /api/v1/pedidos al confirmar
- [ ] 7.2 Al crear pedido exitosamente, limpiar el carrito (zustand cartStore.clear())
- [ ] 7.3 Redireccionar a /pedidos/{id} después de crear
- [ ] 7.4 Manejar errores: mostrar mensaje si falla la creación del pedido

## 8. Integración con Pagos (Webhook)

- [ ] 8.1 Crear/actualizar endpoint POST /api/v1/pagos/webhook en `app/pagos/router.py`
- [ ] 8.2 Validar idempotency_key para evitar procesamiento duplicado
- [ ] 8.3 Al recibir payment status=approved: avanzar pedido a CONFIRMADO, decrementar stock
- [ ] 8.4 Crear/actualizar registro en tabla Pago

## 9. Testing y Verificación

- [ ] 9.1 Probar creación de pedido con Postman/curl
- [ ] 9.2 Probar listado de pedidos
- [ ] 9.3 Probar transición de estados (simular como ADMIN/PEDIDOS)
- [ ] 9.4 Probar decremento de stock al confirmar
- [ ] 9.5 Probar restauración de stock al cancelar
- [ ] 9.6 Probar webhook de MercadoPago (simular payload)
- [ ] 9.7 Verificar frontend: listado y detalle de pedidos
- [ ] 9.8 Verificar integración checkout → pedido → redirección

## 10. Documentación

- [ ] 10.1 Verificar que spec.md esté sincronizado con lo implementado
- [ ] 10.2 Actualizar spec en `openspec/specs/order-management/spec.md` al архивировать
- [ ] 10.3 Commit final con todos los cambios