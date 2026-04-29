# Design: US-000-setup — Infraestructura Base

## Context

Food Store es un sistema de e-commerce de productos alimenticios que requiere:
- **Backend**: FastAPI + SQLModel + PostgreSQL + Alembic
- **Frontend**: React + TypeScript + Vite + Zustand + TanStack Query

El proyecto actual tiene:
- Estructura de carpetas vacía (`backend/` y `frontend/` solo con `.gitkeep`)
- Archivos `.env.example` con variables documentadas
- Documentación completa en `docs/`

## Goals / Non-Goals

**Goals:**
1. Crear estructura feature-first del backend con todos los módulos
2. Configurar FastAPI con middleware (CORS, rate limiting)
3. Crear modelos SQLModel para las 16 entidades del ERD v5
4. Configurar Alembic con migraciones automáticas
5. Implementar script de seed idempotente
6. Crear BaseRepository[T] y UnitOfWork
7. Implementar dependencias FastAPI (get_current_user, require_role)
8. Crear estructura FSD del frontend
9. Configurar Axios con interceptores
10. Implementar stores de Zustand

**Non-Goals:**
- No se implementa lógica de negocio (auth, productos, pedidos)
- No se crea UI más allá de estructura base
- No se conecta con MercadoPago (solo configuración)

## Decisions

### D1: Estructura Feature-First vs Layered
**Decisión**: Usar estructura feature-first (vertical) en backend
**Alternativas consideradas**: Estructura por capas (routers/, services/, models/)
**Rationale**: La documentación especifica feature-first. Facilita la navegación por funcionalidad y reduce acoplamiento entre módulos.

### D2: SQLModel vs SQLAlchemy puro
**Decisión**: Usar SQLModel (de FastAPI creator)
**Alternativas consideradas**: SQLAlchemy 2.0 con Pydantic
**Rationale**: Documentación del proyecto lo especifica. Combina ORM + validación en un modelo.

### D3: Alembic con autogenerate
**Decisión**: Alembic genera migraciones desde modelos SQLModel
**Alternativas consideradas**: Migraciones manuales
**Rationale**: Más maintainable. Reduce errores al sincronizar modelos con schema.

### D4: Zustand con persistencia en localStorage
**Decisión**: Usar middleware persist de Zustand
**Alternativas consideradas**: Redux Toolkit, Context API
**Rationale**: Documentación del proyecto lo especifica. API minimalista, excelente rendimiento.

### D5: Axios con interceptores para JWT
**Decisión**: Interceptor de request adjunta token + interceptor de response maneja 401
**Alternativas consideradas**: Fetch API con manual token handling
**Rationale**: Axios es más conveniente para interceptores y manejo de errores.

## Data Model

### Entidades del ERD v5 (16 tablas)

```
Dominio 1 — Identidad y Acceso:
- Usuario (id, nombre, email, password_hash, telefono, creado_en, actualizado_en, eliminado_en)
- Rol (id, nombre, descripcion)
- UsuarioRol (usuario_id, rol_id) — FK compuesta única
- RefreshToken (id, token, usuario_id, expira_en, revocado_en)
- DireccionEntrega (id, usuario_id, calle, numero, piso_depto, ciudad, cp, referencia, es_predeterminada, creado_en, actualizado_en, eliminado_en)

Dominio 2 — Catálogo:
- Categoria (id, nombre, descripcion, imagen, padre_id) — FK autoreferencial
- Producto (id, nombre, descripcion, imagen, precio, stock_cantidad, disponible, creado_en, actualizado_en, eliminado_en)
- Ingrediente (id, nombre, descripcion, es_alergeno)
- ProductoCategoria (producto_id, categoria_id) — M:N
- ProductoIngrediente (producto_id, ingrediente_id) — M:N
- FormaPago (id, nombre, activo)

Dominio 3 — Ventas:
- EstadoPedido (id, nombre, descripcion)
- Pedido (id, usuario_id, estado_id, direccion_id, forma_pago_id, direccion_snapshot, costo_envio, total, creado_en, actualizado_en, eliminado_en)
- DetallePedido (id, pedido_id, producto_id, cantidad, precio_snapshot, subtotal, personalizacion[])
- HistorialEstadoPedido (id, pedido_id, estado_anterior_id, estado_nuevo_id, usuario_id, observacion, creado_en)
- Pago (id, pedido_id, monto, mp_payment_id, mp_status, external_reference, idempotency_key, creado_en, actualizado_en)
```

## API Structure

### Backend Routes (prefijo: /api/v1)
```
/api/v1/auth/        → auth module
/api/v1/usuarios/    → usuarios module
/api/v1/categorias/ → categorias module
/api/v1/productos/   → productos module
/api/v1/pedidos/     → pedidos module
/api/v1/pagos/       → pagos module
/api/v1/direcciones/ → direcciones module
/api/v1/admin/       → admin module
```

### Frontend Routes
```
/                    → Home (público)
/login               → Login (público)
/register            → Registro (público)
/catalog             → Catálogo (público)
/cart                → Carrito (privado)
/checkout            → Checkout (privado)
/orders              → Mis pedidos (privado)
/orders/:id          → Detalle pedido (privado)
/admin               → Panel admin (ADMIN)
/admin/products      → Gestión productos (STOCK, ADMIN)
/admin/orders        → Gestión pedidos (PEDIDOS, ADMIN)
```

## Implementation Notes

### Backend
1. Cada módulo (auth, productos, etc.) contiene:
   - `model.py` → SQLModel
   - `schemas.py` → Pydantic (Create, Update, Read)
   - `repository.py` → Repositorio específico
   - `service.py` → Lógica de negocio
   - `router.py` → Endpoints FastAPI

2. `core/config.py` → Settings con Pydantic BaseSettings
3. `core/database.py` → SQLModel engine + sessionmaker
4. `core/security.py` → bcrypt hashing, JWT create/decode
5. `core/exceptions.py` → Custom exceptions (HTTPException wrapper RFC 7807)

### Frontend
1. Estructura FSD:
   - `shared/` → API, componentes UI, types, utils
   - `entities/` → Modelos de dominio (Producto, Pedido, Usuario)
   - `features/` → Features (auth, cart, checkout)
   - `widgets/` → Componentes compuestos
   - `pages/` → Rutas
   - `app/` → Providers, routing

2. Stores Zustand:
   - `authStore` → tokens, user, isAuthenticated
   - `cartStore` → items, add/remove/update/clear
   - `paymentStore` → preferencia, status
   - `uiStore` → theme, sidebar, notifications

## Migration Plan

### Paso 1: Backend Setup
1. Crear `requirements.txt` con todas las dependencias
2. Crear estructura de carpetas feature-first
3. Crear `app/main.py` con FastAPI
4. Crear `app/core/` (config, database, security, exceptions)

### Paso 2: Modelos y Migraciones
1. Crear todos los modelos en `app/models/`
2. Configurar Alembic: `alembic init alembic`
3. Generar migración: `alembic revision --autogenerate`
4. Ejecutar: `alembic upgrade head`

### Paso 3: Seed Data
1. Crear script seed idempotente
2. Ejecutar: `python -m app.db.seed`

### Paso 4: Patrones Base
1. Implementar `BaseRepository[T]`
2. Implementar `UnitOfWork`
3. Crear `get_current_user` y `require_role`

### Paso 5: Frontend Setup
1. `npm create vite@latest . -- --template react-ts`
2. Instalar dependencias
3. Configurar Tailwind
4. Crear estructura FSD
5. Crear stores Zustand

### Rollback
- Backend: `alembic downgrade -1`
- Frontend: eliminar node_modules y recrear

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| PostgreSQL no disponible | Usar Docker Compose para levantar BD local |
| Dependencias conflictivas | Usar virtualenv/venv隔离 |
| Seed no idempotente | Usar `INSERT ... ON CONFLICT DO NOTHING` |
| Migration fallida | Backup de DB antes de migrar |
| CORS blocks frontend | Verificar que CORS_ORIGINS incluya localhost:5173 |
| JWT expira durante test | Aumentar tiempo de expiración en entorno de test |

## Open Questions

1. ¿Se usará Docker Compose para desarrollo local?
2. ¿El admin inicial se crea en seed o se permite registro?
3. ¿Qué formato de imágenes se aceptará? (URL vs base64 vs upload)
