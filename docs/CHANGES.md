# Mapa Completo de Changes — Food Store v5.0

## Introducción

Este documento define el **mapa de changes** para desarrollar Food Store de principio a fin. Cada change es una unidad de trabajo atómica que implementa una funcionalidad completa con sus artefactos (proposal, design, tasks) y sus dependencias claramente documentadas.

El orden de implementación es **estrictamente secuencial**: un change solo puede iniciarse cuando todos sus cambios dependientes están archivados.

---

## Leyenda de Épicas

- **EPIC-00**: Infraestructura y Setup
- **EPIC-01**: Autenticación y Autorización
- **EPIC-02**: Navegación y Layout Base
- **EPIC-03**: Categorías
- **EPIC-04**: Ingredientes
- **EPIC-05**: Productos
- **EPIC-06**: Direcciones de Entrega
- **EPIC-07**: Carrito de Compras
- **EPIC-08**: Pedidos — Creación
- **EPIC-09**: Pedidos — Máquina de Estados
- **EPIC-10**: Pagos — MercadoPago
- **EPIC-11**: Admin — Panel y Métricas

---

## EPIC-00: Infraestructura y Setup

### Change: `infra-repo-structure`
**Funcionalidad**: Inicialización del repositorio y estructura de carpetas base
**Historias**: US-000
**Dependencias**: Ninguna (primer change)

- **Qué cubre**: Crear monorepo con carpetas `/backend` y `/frontend`, estructura feature-first en backend, FSD en frontend, `.gitignore`, `README.md`, `.env.example`.
- **Por qué**: Sin esta base, no existe nada. Es la fundación sobre la que se construye todo.
- **Historias de usuario**:
  - US-000: Scaffolding del monorepo

---

### Change: `infra-backend-fastapi-setup`
**Funcionalidad**: Configuración del backend con FastAPI, dependencias core y estructura
**Historias**: US-000a
**Dependencias**: `infra-repo-structure` (necesita carpeta `/backend`)

- **Qué cubre**: Configurar FastAPI, SQLModel, Alembic, Passlib, python-jose, slowapi. Crear `main.py`, `core/config.py`, `core/database.py`, `core/security.py`. Middleware de CORS y rate limiting. Documentación Swagger en `/docs`.
- **Por qué**: Sin esto, no hay servidor backend. Todo dependencia depende de que el proyecto levante.
- **Historias de usuario**:
  - US-000a: Configuración del entorno backend

---

### Change: `infra-frontend-react-vite-setup`
**Funcionalidad**: Configuración del frontend con React, TypeScript, Vite y dependencias
**Historias**: US-000c
**Dependencias**: `infra-repo-structure` (necesita carpeta `/frontend`)

- **Qué cubre**: Instalar React, TypeScript, Vite, Tailwind CSS, TanStack Query, TanStack Form, Zustand, Axios, recharts. Configurar `tsconfig.json` en modo estricto, PostCSS, estructura FSD.
- **Por qué**: Necesario para que el frontend pueda desarrollarse.
- **Historias de usuario**:
  - US-000c: Configuración del entorno frontend

---

### Change: `infra-database-migrations-seed`
**Funcionalidad**: Base de datos PostgreSQL, migraciones Alembic y datos semilla
**Historias**: US-000b
**Dependencias**: `infra-backend-fastapi-setup` (necesita configuración de BD)

- **Qué cubre**: Crear todas las tablas del ERD v5 con Alembic. Seed data: 4 Roles (ADMIN, STOCK, PEDIDOS, CLIENT), 6 EstadoPedido, Formas de Pago, usuario admin inicial. Script idempotente.
- **Por qué**: Sin tablas no hay persistencia. El seed carga los catálogos mínimos necesarios.
- **Historias de usuario**:
  - US-000b: Configuración de PostgreSQL, migraciones y seed data

---

### Change: `infra-patterns-base-repo-uow`
**Funcionalidad**: Patrones de infraestructura (BaseRepository genérico, Unit of Work, dependencias FastAPI)
**Historias**: US-000d
**Dependencias**: `infra-database-migrations-seed` (necesita entidades en BD)

- **Qué cubre**: Implementar `BaseRepository[T]` genérico con CRUD. `UnitOfWork` como context manager con commit/rollback automático. Dependencias FastAPI: `get_current_user`, `require_role`. Middleware RFC 7807 de errores.
- **Por qué**: Todos los módulos funcionales necesitan estos patrones. Sin ellos, no hay forma consistente de acceder a BD ni autenticar.
- **Historias de usuario**:
  - US-000d: Implementación de patrones base
  - US-068: Manejo de errores estandarizado

---

### Change: `infra-zustand-stores`
**Funcionalidad**: Stores de Zustand (auth, cart, payment, ui)
**Historias**: US-000e
**Dependencias**: `infra-frontend-react-vite-setup` (necesita Zustand y TypeScript configurados)

- **Qué cubre**: Implementar 4 stores tipados: `authStore` (tokens, usuario, isAuth), `cartStore` (items, cantidad, personalización), `paymentStore` (status MP, preferenceId), `uiStore` (theme, sidebar). Persistencia selectiva con localStorage.
- **Por qué**: El frontend necesita gestión de estado consistente desde el inicio. Separación clara entre estado del cliente (Zustand) y estado del servidor (TanStack Query).
- **Historias de usuario**:
  - US-000e: Configuración de stores Zustand

---

## EPIC-01: Autenticación y Autorización

### Change: `auth-registration-login`
**Funcionalidad**: Registro e inicio de sesión de usuarios
**Historias**: US-001, US-002
**Dependencias**: `infra-patterns-base-repo-uow` (necesita patrones de backend), `infra-zustand-stores` (necesita authStore)

- **Qué cubre**: Endpoints backend POST `/auth/register` y `/auth/login`. Validación de credenciales, hashing bcrypt, generación de JWT (access + refresh tokens). Frontend con formularios de login/registro, guardado en authStore, interceptor Axios para Bearer token.
- **Por qué**: Sin autenticación, no hay seguridad. Es la base del RBAC.
- **Historias de usuario**:
  - US-001: Registro de cliente
  - US-002: Login de usuario

---

### Change: `auth-refresh-logout`
**Funcionalidad**: Renovación de token y logout
**Historias**: US-003, US-004
**Dependencias**: `auth-registration-login` (necesita tokens generados)

- **Qué cubre**: Endpoint POST `/auth/refresh` con rotación de refresh tokens. POST `/auth/logout` que invalida token en BD. Frontend: interceptor 401 que renueva automáticamente, manejo de logout.
- **Por qué**: Mejora seguridad (rotación de tokens) y experiencia (renovación transparente sin logout forzado).
- **Historias de usuario**:
  - US-003: Refresh de token
  - US-004: Logout

---

### Change: `auth-rbac-roles`
**Funcionalidad**: Control de acceso basado en roles (RBAC)
**Historias**: US-005, US-006
**Dependencias**: `auth-registration-login` (necesita roles en JWT)

- **Qué cubre**: Endpoint admin POST `/users/{id}/roles` para asignar roles. Dependency `require_role([])` en FastAPI que valida roles. Frontend: HOC `withAuth(Component, requiredRoles)` para proteger rutas. Middleware de autorización en backend y frontend.
- **Por qué**: Implementa la segregación de responsabilidades. Sin RBAC no hay forma de dar permisos granulares.
- **Historias de usuario**:
  - US-005: Gestión de roles
  - US-006: Protección de rutas por rol

---

### Change: `auth-rate-limiting-security`
**Funcionalidad**: Rate limiting y seguridad en endpoints críticos
**Historias**: US-073, US-074
**Dependencias**: `infra-backend-fastapi-setup` (necesita slowapi configurado)

- **Qué cubre**: Rate limiting con slowapi: 5 intentos de login en 15 min. Validación y sanitización de inputs con Pydantic v2. Headers de seguridad (CORS, X-Content-Type-Options).
- **Por qué**: Protege contra fuerza bruta e inyecciones.
- **Historias de usuario**:
  - US-073: Rate limiting en endpoints sensibles
  - US-074: Validación y sanitización de inputs

---

## EPIC-02: Navegación y Layout Base

### Change: `frontend-navbar-menu`
**Funcionalidad**: Navegación adaptada por rol
**Historias**: US-075
**Dependencias**: `auth-rbac-roles` (necesita roles en JWT)

- **Qué cubre**: Componente Navbar con menú dinámico según rol. Selects en authStore para hasRole(). Rutas públicas (catalog, login) y protegidas según rol.
- **Por qué**: UX mejorada: cada usuario ve solo las opciones que puede usar.
- **Historias de usuario**:
  - US-075: Navegación por rol

---

### Change: `frontend-route-guards`
**Funcionalidad**: Protección de rutas en frontend
**Historias**: US-076
**Dependencias**: `frontend-navbar-menu` (necesita navbar para redirigir)

- **Qué cubre**: Route guards en React Router que validan autenticación y rol. Redireccionamiento a login si no autenticado, a 403 si rol insuficiente.
- **Por qué**: Previene acceso a vistas no autorizadas.
- **Historias de usuario**:
  - US-076: Protección de rutas en frontend

---

### Change: `frontend-token-refresh-interceptor`
**Funcionalidad**: Renovación transparente de token en frontend
**Historias**: US-066
**Dependencias**: `auth-refresh-logout` (necesita endpoint de refresh)

- **Qué cubre**: Interceptor Axios que detecta 401, llama refresh automáticamente, actualiza authStore, reintenta request. Cola de requests pendientes para evitar race conditions.
- **Por qué**: Mejora UX: el usuario nunca ve "su sesión expiró" de forma sorpresiva.
- **Historias de usuario**:
  - US-066: Manejo de token expirado en frontend

---

### Change: `frontend-error-handling`
**Funcionalidad**: Manejo centralizado de errores
**Historias**: US-067
**Dependencias**: `infra-patterns-base-repo-uow` (necesita RFC 7807)

- **Qué cubre**: Error boundary en React. Interceptor que mapea códigos HTTP a mensajes amigables. Toast/notification system para errores.
- **Por qué**: Experiencia de usuario consistente y clara.
- **Historias de usuario**:
  - US-067: Manejo de errores global en frontend

---

## EPIC-03: Gestión de Categorías

### Change: `product-categories-hierarchy`
**Funcionalidad**: CRUD de categorías jerárquicas
**Historias**: US-007, US-008, US-009, US-010
**Dependencias**: `infra-patterns-base-repo-uow` (necesita patrones base)

- **Qué cubre**: Backend: endpoints POST/GET/PUT/DELETE `/categorias` con CTE recursivo para jerarquías. Validación de ciclos. Soft delete. Frontend: formularios para crear/editar, vista de árbol de categorías (público).
- **Por qué**: Las categorías son la base del catálogo. Permiten organizar productos de forma flexible.
- **Historias de usuario**:
  - US-007: Crear categoría
  - US-008: Listar categorías jerárquicas
  - US-009: Editar categoría
  - US-010: Eliminar categoría (soft delete)

---

## EPIC-04: Gestión de Ingredientes

### Change: `ingredients-allergens-management`
**Funcionalidad**: CRUD de ingredientes con marcado de alérgenos
**Historias**: US-011, US-012, US-013, US-014
**Dependencias**: `infra-patterns-base-repo-uow` (necesita patrones base)

- **Qué cubre**: Backend: endpoints POST/GET/PUT/DELETE `/ingredientes` con campo `es_alergeno`. Filtros por alérgeno. Soft delete. Frontend: listado de ingredientes (admin), badges de alérgenos.
- **Por qué**: Información crítica para cumplir regulaciones alimentarias. Los clientes con restricciones dietarias necesitan esta información.
- **Historias de usuario**:
  - US-011: Crear ingrediente
  - US-012: Listar ingredientes
  - US-013: Editar ingrediente
  - US-014: Eliminar ingrediente (soft delete)

---

## EPIC-05: Gestión de Productos

### Change: `products-crud-creation`
**Funcionalidad**: CRUD de productos con precio, stock e imagen
**Historias**: US-015, US-020, US-021, US-022
**Dependencias**: `product-categories-hierarchy` (necesita categorías existentes), `ingredients-allergens-management` (necesita ingredientes existentes)

- **Qué cubre**: Backend: endpoints POST/GET/PUT/DELETE `/productos`. Precio como DECIMAL, stock como entero. Validación de disponibilidad. Soft delete. Frontend: formularios de CRUD de productos (admin), listado con filtros internos.
- **Por qué**: Es el corazón del catálogo. Toda compra gira alrededor de productos.
- **Historias de usuario**:
  - US-015: Crear producto
  - US-020: Editar producto
  - US-021: Gestionar stock de producto
  - US-022: Eliminar producto (soft delete)

---

### Change: `products-relationships`
**Funcionalidad**: Asociar productos a categorías e ingredientes
**Historias**: US-016, US-017
**Dependencias**: `products-crud-creation` (necesita productos existentes), `product-categories-hierarchy`, `ingredients-allergens-management`

- **Qué cubre**: Endpoints PATCH `/productos/{id}/categorias` y `/productos/{id}/ingredientes`. Pivotes ProductoCategoria y ProductoIngrediente. Frontend: selectores multi-select en formulario de producto.
- **Por qué**: Define la composición de cada producto. Crítico para búsqueda y filtrado.
- **Historias de usuario**:
  - US-016: Asociar producto a categorías
  - US-017: Asociar ingredientes a producto

---

### Change: `products-catalog-public`
**Funcionalidad**: Catálogo público con filtros y búsqueda
**Historias**: US-018, US-019, US-023
**Dependencias**: `products-relationships` (necesita relaciones completas)

- **Qué cubre**: Backend: GET `/productos` con filtros (categoría, búsqueda, rango precio, alérgenos). Paginación. GET `/productos/{id}` con detalles completos. Frontend: grid de productos con lazy loading, skeleton, filtros con debounce, modal de detalle.
- **Por qué**: Es la experiencia principal del cliente. Buscar y encontrar productos es lo más importante.
- **Historias de usuario**:
  - US-018: Listar productos del catálogo (público)
  - US-019: Ver detalle de producto
  - US-023: Filtrar productos por alérgenos

---

## EPIC-06: Gestión de Direcciones de Entrega

### Change: `addresses-management`
**Funcionalidad**: CRUD de direcciones de entrega por usuario
**Historias**: US-024, US-025, US-026, US-027, US-028
**Dependencias**: `auth-registration-login` (necesita usuarios autenticados)

- **Qué cubre**: Backend: endpoints CRUD `/direcciones` con validación de ownership. PATCH `/direcciones/{id}/principal` para marcar predeterminada. Soft delete. Frontend: listado de direcciones del cliente, formulario de creación/edición, selector de dirección en checkout.
- **Por qué**: Sin direcciones, no hay entrega. Es información crítica para el pedido.
- **Historias de usuario**:
  - US-024: Crear dirección de entrega
  - US-025: Ver direcciones propias
  - US-026: Editar dirección propia
  - US-027: Eliminar dirección propia
  - US-028: Marcar dirección como principal

---

## EPIC-07: Carrito de Compras

### Change: `cart-client-side-persistence`
**Funcionalidad**: Carrito en cliente con persistencia localStorage
**Historias**: US-029, US-030, US-031, US-032, US-033, US-034
**Dependencias**: `infra-zustand-stores` (necesita cartStore implementado), `products-catalog-public` (necesita productos públicos)

- **Qué cubre**: Frontend: componente CartDrawer con listado de items. Acciones: addItem, removeItem, updateQuantity, clearCart. Cálculo de subtotal y total (sin envío aún). Persistencia en localStorage. Personalización: exclusión de ingredientes.
- **Por qué**: El carrito es la transición entre browsing y compra. Todo debe funcionar sin servidor para responsividad.
- **Historias de usuario**:
  - US-029: Agregar producto al carrito
  - US-030: Personalizar ingredientes en carrito
  - US-031: Ver carrito
  - US-032: Modificar cantidad en carrito
  - US-033: Eliminar item del carrito
  - US-034: Vaciar carrito

---

## EPIC-08: Pedidos — Creación

### Change: `orders-creation-checkout`
**Funcionalidad**: Creación de pedidos con Unit of Work atómico
**Historias**: US-035, US-036, US-037, US-038
**Dependencias**: `cart-client-side-persistence` (necesita carrito), `addresses-management` (necesita direcciones), `products-relationships` (necesita snapshots de producto)

- **Qué cubre**: Backend: POST `/pedidos` con lógica en Service que orquesta UoW. Validación de stock (SELECT FOR UPDATE). Creación de pedido + detalles + historial inicial en una transacción. Snapshots de precio, nombre, dirección. Frontend: página de checkout que toma carrito → dirección → forma pago → resumen → confirmar.
- **Por qué**: Es la operación más compleja. Debe ser atómica. RN-01/02/03 dependen de esto.
- **Historias de usuario**:
  - US-035: Crear pedido desde carrito
  - US-036: Validar stock al crear pedido
  - US-037: Crear snapshots de precio
  - US-038: Crear snapshots de dirección

---

## EPIC-09: Pedidos — Máquina de Estados

### Change: `orders-fsm-state-machine`
**Funcionalidad**: Máquina de estados del pedido y transiciones validadas
**Historias**: US-039, US-040, US-041, US-042, US-043, US-044
**Dependencias**: `orders-creation-checkout` (necesita pedidos existentes)

- **Qué cubre**: Backend: PATCH `/pedidos/{id}/estado` que valida transición según FSM. Decremento de stock en PENDIENTE→CONFIRMADO. Restauración de stock en cancelación. HistorialEstadoPedido append-only. Frontend: vista de estado del pedido con timeline de transiciones. Bot para Gestor de Pedidos.
- **Por qué**: Implementa la máquina de estados. Sin esto, los pedidos no tienen ciclo de vida definido.
- **Historias de usuario**:
  - US-039: Transición PENDIENTE→CONFIRMADO (automática por pago)
  - US-040: Transición CONFIRMADO→EN_PREP
  - US-041: Transición EN_PREP→EN_CAMINO
  - US-042: Transición EN_CAMINO→ENTREGADO
  - US-043: Cancelación de pedido (desde cualquier estado válido)
  - US-044: Historial de cambios de estado

---

## EPIC-10: Pagos — MercadoPago

### Change: `payments-mercadopago-integration`
**Funcionalidad**: Integración con MercadoPago Checkout API
**Historias**: US-045, US-046, US-047, US-048
**Dependencias**: `orders-creation-checkout` (necesita pedidos en PENDIENTE), `orders-fsm-state-machine` (necesita transiciones)

- **Qué cubre**: Backend: POST `/pagos/crear` que genera preferencia MP. Tabla Pago con idempotency_key. POST `/pagos/webhook` que procesa IPN y avanza pedido. Webhook verifica firma MP. Frontend: CardPayment con SDK MercadoPago.js (tokenización segura). Modal de confirmación de pago. Polling de estado.
- **Por qué**: Sin pagos, no hay ingresos. Integración más crítica del sistema.
- **Historias de usuario**:
  - US-045: Crear preferencia de pago MercadoPago
  - US-046: Procesar webhook IPN de MercadoPago
  - US-047: Rechazar pago e reintentar
  - US-048: Múltiples intentos de pago

---

## EPIC-11: Admin — Panel y Métricas

### Change: `admin-dashboard-kpis`
**Funcionalidad**: Dashboard con KPIs y gráficos
**Historias**: US-049, US-050, US-051, US-052, US-053, US-054, US-055
**Dependencias**: `payments-mercadopago-integration` (necesita datos de ventas)

- **Qué cubre**: Backend: GET `/admin/dashboard` con métricas (total ventas, cantidad pedidos, usuario activos, top productos). Frontend: Dashboard admin con recharts (gráficos de barras, líneas, tortas). Filtros por fecha. Componentes de KPI con números grandes.
- **Por qué**: Los admins necesitan visibilidad del negocio. Métricas informan decisiones.
- **Historias de usuario**:
  - US-049: Ver dashboard de ventas
  - US-050: Filtrar metrics por fecha
  - US-051: Exportar reportes
  - US-052: Ver usuarios activos
  - US-053: Ver top 10 productos
  - US-054: Asignar roles desde admin
  - US-055: Ver histórico de cambios

---

### Change: `admin-crud-management`
**Funcionalidad**: CRUDs de administración para productos, usuarios, pedidos
**Historias**: US-056, US-057, US-058, US-059, US-060, US-061, US-062, US-063, US-064
**Dependencias**: `admin-dashboard-kpis` (necesita admin dashboard base), `products-relationships` (necesita productos completos)

- **Qué cubre**: Backend: endpoints CRUD con permisos por rol para cada entidad. Frontend: tablas de gestión con acciones (editar, eliminar, cambiar estado). Formularios modal para CRUD. Paginación, búsqueda, filtros.
- **Por qué**: Los admins necesitan herramientas para gestionar el sistema. Soporte al negocio.
- **Historias de usuario**:
  - US-056: Listar usuarios (admin)
  - US-057: Editar usuario (admin)
  - US-058: Desactivar usuario (admin)
  - US-059: Listar todos los pedidos (admin/pedidos)
  - US-060: Cambiar estado de pedido (gestor pedidos)
  - US-061: Ver perfil propio
  - US-062: Editar perfil propio
  - US-063: Cambiar contraseña
  - US-064: Ver papelera (soft deleted items)

---

---

## Tabla de Resumen

| Orden | Change | Épica | Depende De | Historias |
|-------|--------|-------|-----------|-----------|
| 1 | `infra-repo-structure` | EPIC-00 | — | US-000 |
| 2 | `infra-backend-fastapi-setup` | EPIC-00 | #1 | US-000a |
| 3 | `infra-frontend-react-vite-setup` | EPIC-00 | #1 | US-000c |
| 4 | `infra-database-migrations-seed` | EPIC-00 | #2 | US-000b |
| 5 | `infra-patterns-base-repo-uow` | EPIC-00 | #4 | US-000d, US-068 |
| 6 | `infra-zustand-stores` | EPIC-00 | #3 | US-000e |
| 7 | `auth-registration-login` | EPIC-01 | #5, #6 | US-001, US-002 |
| 8 | `auth-refresh-logout` | EPIC-01 | #7 | US-003, US-004 |
| 9 | `auth-rbac-roles` | EPIC-01 | #7 | US-005, US-006 |
| 10 | `auth-rate-limiting-security` | EPIC-01 | #2 | US-073, US-074 |
| 11 | `frontend-navbar-menu` | EPIC-02 | #9 | US-075 |
| 12 | `frontend-route-guards` | EPIC-02 | #11 | US-076 |
| 13 | `frontend-token-refresh-interceptor` | EPIC-02 | #8 | US-066 |
| 14 | `frontend-error-handling` | EPIC-02 | #5 | US-067 |
| 15 | `product-categories-hierarchy` | EPIC-03 | #5 | US-007 a US-010 |
| 16 | `ingredients-allergens-management` | EPIC-04 | #5 | US-011 a US-014 |
| 17 | `products-crud-creation` | EPIC-05 | #15, #16 | US-015, US-020, US-021, US-022 |
| 18 | `products-relationships` | EPIC-05 | #17, #15, #16 | US-016, US-017 |
| 19 | `products-catalog-public` | EPIC-05 | #18 | US-018, US-019, US-023 |
| 20 | `addresses-management` | EPIC-06 | #7 | US-024 a US-028 |
| 21 | `cart-client-side-persistence` | EPIC-07 | #6, #19 | US-029 a US-034 |
| 22 | `orders-creation-checkout` | EPIC-08 | #21, #20, #18 | US-035 a US-038 |
| 23 | `orders-fsm-state-machine` | EPIC-09 | #22 | US-039 a US-044 |
| 24 | `payments-mercadopago-integration` | EPIC-10 | #22, #23 | US-045 a US-048 |
| 25 | `admin-dashboard-kpis` | EPIC-11 | #24 | US-049 a US-055 |
| 26 | `admin-crud-management` | EPIC-11 | #25, #18 | US-056 a US-064 |

---

## Cómo Usar Este Mapa

1. **Orden estricto**: No proponer un change hasta que todos sus dependencias estén archivados.
2. **Verificación previa**: Antes de `/opsx:apply`, revisar que `proposal.md` y `design.md` sean correctos.
3. **Una PR por change**: Cada change genera exactamente una rama y una PR.
4. **Documentación viva**: Al archivar, las specs se copian a `openspec/specs/` para contexto futuro.

---

## Notas Importantes

### Paralelización posible
Algunos changes sin dependencias directas podrían hacerse en paralelo:
- `#2`, `#3` (backend y frontend setup)
- `#15`, `#16` (categorías e ingredientes, no dependen el uno del otro)

Sin embargo, **se recomienda orden secuencial** para mantener claridad y facilitar debugging.

### Retroalimentación en changes posteriores
Si al implementar un change se descubre que la propuesta anterior necesita ajuste:
1. Crear un PR de corrección en el change anterior
2. Rebasar el change actual sobre esa corrección
3. Documentar la razón en el commit message

### Validación de calidad
Cada change archivado debe cumplir:
- ✅ `alembic upgrade head` sin errores (si toca BD)
- ✅ `npm run test` sin fallos (si hay tests)
- ✅ Specs sincronizadas en `openspec/specs/`
- ✅ PR revisada y mergeada a `main`
