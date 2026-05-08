# 🤖 AGENTS.md — Guía para Agentes de IA

Sistema de e-commerce de productos alimenticios desarrollado con **Spec-Driven Development (SDD)** usando **OPSX** (OpenSpec) y **Claude Code**.

Este documento describe la estructura del repositorio, el flujo de desarrollo, las convenciones de código, la arquitectura del sistema y las instrucciones específicas para agentes de IA que trabajen en este proyecto.

---

## 📋 Tabla de Contenidos

1. [Estructura del Proyecto](#estructura-del-proyecto)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Flujo de Desarrollo con OPSX](#flujo-de-desarrollo-con-opsx)
4. [Especificaciones del Sistema](#especificaciones-del-sistema)
5. [Arquitectura Frontend](#arquitectura-frontend)
6. [Arquitectura Backend](#arquitectura-backend)
7. [Convenciones de Código](#convenciones-de-código)
8. [Instrucciones para Agentes de IA](#instrucciones-para-agentes-de-ia)
9. [Guía de Seguridad](#guía-de-seguridad)
10. [Variables de Entorno](#variables-de-entorno)

---

## Estructura del Proyecto

```
RepositorioBaseFoodStore-SDD/
│
├── backend/                          # API FastAPI · SQLModel · PostgreSQL
│   ├── app/
│   │   ├── admin/                   # US-007: Panel administrativo
│   │   ├── auth/                    # US-001: Autenticación JWT + RBAC
│   │   ├── categorias/              # US-002: Catálogo jerárquico
│   │   ├── core/                    # Config, dependencias, excepciones
│   │   ├── db/                      # Conexión, session, seed
│   │   ├── direcciones/             # US-008: Direcciones de entrega
│   │   ├── ingredientes/            # Componentes de productos
│   │   ├── models/                  # Modelos SQLModel (ORM)
│   │   ├── pagos/                   # US-006: MercadoPago · webhooks
│   │   ├── pedidos/                 # US-005: Gestión de pedidos · FSM
│   │   ├── productos/               # US-003: CRUD · stock
│   │   ├── refreshtokens/           # Gestión de refresh tokens
│   │   ├── repositories/            # Data access layer
│   │   └── usuarios/                # Gestión de usuarios
│   ├── migrations/                  # Alembic migrations
│   ├── main.py                      # Punto de entrada FastAPI
│   ├── requirements.txt              # Dependencias Python
│   ├── .env.example                 # Variables de entorno (template)
│   └── .env                         # Variables de entorno (no commitear)
│
├── frontend/                         # React · TypeScript · Vite · Tailwind
│   ├── src/
│   │   ├── app/                     # Configuración principal de la app
│   │   ├── entities/                # Modelos de negocio (types, interfaces)
│   │   ├── features/                # Módulos funcionales
│   │   │   ├── auth/               # US-001: Login, registro, JWT
│   │   │   ├── cart/               # US-004: Carrito Zustand
│   │   │   ├── payment/            # US-006: Checkout MercadoPago
│   │   │   └── ui/                 # Componentes UI compartidos
│   │   ├── pages/                   # Páginas de la aplicación
│   │   ├── shared/                  # Recursos compartidos
│   │   │   ├── api/                # Cliente HTTP (Axios)
│   │   │   ├── components/         # Componentes reutilizables
│   │   │   ├── types/              # TypeScript global types
│   │   │   └── utils/              # Utilidades
│   │   └── widgets/                 # Componentes de página (header, footer)
│   ├── index.html                   # Entry HTML
│   ├── package.json                 # Dependencias Node.js
│   ├── tsconfig.json                # TypeScript config
│   ├── vite.config.ts               # Vite config
│   ├── tailwind.config.js           # Tailwind CSS config
│   ├── postcss.config.js            # PostCSS config
│   ├── .env.example                 # Variables de entorno (template)
│   └── .env                         # Variables de entorno (no commitear)
│
├── docs/                            # Documentación del dominio (FUENTE DE VERDAD)
│   ├── Descripcion.txt              # Visión, actores, stack, reglas de negocio
│   ├── Integrador.txt               # Arquitectura en capas, ERD, API REST
│   └── Historias_de_usuario.txt     # US-000 a US-076 con criterios de aceptación
│
├── openspec/                        # OPSX: Sistema de cambios y especificaciones
│   ├── config.yaml                  # Configuración de OPSX
│   ├── specs/                       # Especificaciones de capacidades (fuente de verdad)
│   │   └── capability/
│   │       └── spec.md              # Especificación delta
│   └── changes/                     # Cambios activos e historial
│       ├── <change-name>/
│       │   ├── .openspec.yaml       # Metadata del change
│       │   ├── proposal.md          # Propuesta (qué + por qué)
│       │   ├── design.md            # Diseño técnico (cómo)
│       │   ├── tasks.md             # Checklist de implementación
│       │   └── specs/               # Delta specs (opcional)
│       └── archive/                 # Changes cerrados
│
├── .agents/                         # Configuración de agentes de IA
│   ├── SKILLS.md                    # Inventario de skills instaladas
│   └── skills/                      # Skills personalizadas del proyecto
│       ├── api-design-principles/
│       ├── api-authentication/
│       ├── database-expert/
│       ├── fastapi/
│       ├── jwt-authentication/
│       ├── database/
│       ├── secure-auth/
│       ├── testing-apis/
│       └── find-skills/
│
├── .git/                            # Control de versiones
├── README.md                        # Guía de inicio rápido
├── AGENTS.md                        # Este archivo
└── skills-lock.json                 # Lock de skills instaladas
```

---

## Stack Tecnológico

### Backend

| Componente | Tecnología | Versión |
|------------|-----------|---------|
| Framework | **FastAPI** | ≥0.115.0 |
| Server | **Uvicorn** | ≥0.34.0 |
| ORM | **SQLModel** | ≥0.0.21 |
| Base de datos | **PostgreSQL** | 15+ |
| Migraciones | **Alembic** | ≥1.14.0 |
| Autenticación | **python-jose** + **passlib[bcrypt]** | - |
| Validación | **Pydantic** | ≥2.10.0 |
| Rate limiting | **slowapi** | ≥0.1.9 |
| Pagos | **MercadoPago SDK** | ≥2.2.0 |

### Frontend

| Componente | Tecnología | Versión |
|------------|-----------|---------|
| Framework | **React** | 18+ |
| Lenguaje | **TypeScript** | - |
| Build tool | **Vite** | - |
| HTTP Client | **Axios** | - |
| State management | **Zustand** | - |
| Server state | **TanStack Query** | - |
| Forms | **TanStack Form** | - |
| Styling | **Tailwind CSS** | - |
| Gráficos | **Recharts** | - |

---

## Flujo de Desarrollo con OPSX

OPSX (OpenSpec) es un sistema de cambios basado en especificaciones. **Todo cambio al sistema sigue este ciclo**:

```
┌─────────────────────┐
│  /opsx:explore      │  (opcional) Pensar y explorar antes de comprometerse
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  /opsx:propose      │  Crear propuesta + diseño + tareas de implementación
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   /opsx:apply       │  Implementar tarea por tarea según checklist
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  /opsx:archive      │  Sincronizar specs y cerrar el change
└─────────────────────┘
```

### Fases de OPSX

#### 1️⃣ **Explore** (Opcional)
- **Comando**: `/opsx:explore <tema>`
- **Propósito**: Pensar, investigar y validar supuestos antes de comprometerse
- **Artefactos**: Notas de pensamiento (no se guardan formalmente)
- **Cuándo**: Al iniciar cambios complejos o cuando hay incertidumbre
- **Skills recomendadas**: `api-design-principles`, `database-expert`

#### 2️⃣ **Propose** (Obligatorio)
- **Comando**: `/opsx:propose <change-name>`
- **Propósito**: Crear propuesta formal con todos los artefactos iniciales
- **Artefactos generados**:
  - `proposal.md` - Qué se hace y por qué
  - `design.md` - Cómo se implementa (arquitectura, flujos, modelos)
  - `tasks.md` - Checklist de implementación
- **Entrada**: User stories de `docs/Historias_de_usuario.txt`, línea de contexto
- **Skills recomendadas**: `api-design-principles`, `database-expert`, `fastapi`

#### 3️⃣ **Apply** (Obligatorio)
- **Comando**: `/opsx:apply <change-name>`
- **Propósito**: Implementar código según `tasks.md`
- **Entrada**: Revisar `proposal.md`, `design.md`, `tasks.md` y `spec.md`
- **Proceso**:
  - Crear rama Git: `git checkout -b change/<change-name>`
  - Implementar tarea por tarea del checklist
  - Hacer commit por tarea completada
  - Tests y validación continua
- **Skills recomendadas**: `fastapi`, `database`, `secure-auth`, `testing-apis`
- **Salida**: PR con cambios implementados

#### 4️⃣ **Archive** (Obligatorio)
- **Comando**: `/opsx:archive <change-name>`
- **Propósito**: Sincronizar especificaciones y cerrar el change
- **Proceso**:
  - Validar que todas las tareas estén completadas
  - Sincronizar delta specs en `openspec/specs/`
  - Mover change a `openspec/changes/archive/`
  - Mergear PR a main
- **Salida**: Change archivado, specs actualizadas

### Orden de Implementación Recomendado

```
Fase 0: Infraestructura Base
├── us-000-setup              ← BD, conexión, config, seed

Fase 1: Autenticación y Usuarios
├── us-001-auth               ← JWT · RBAC · refresh tokens
├── us-008-direcciones        ← Direcciones de entrega

Fase 2: Catálogo
├── us-002-categorias         ← Catálogo jerárquico
├── us-003-productos          ← CRUD · stock · ingredientes

Fase 3: Compra
├── us-004-carrito            ← Estado client-side con Zustand
├── us-005-pedidos            ← UoW · FSM · audit trail

Fase 4: Monetización
├── us-006-pagos-mercadopago  ← Checkout · webhooks IPN

Fase 5: Administración
└── us-007-admin              ← Panel · métricas
```

---

## Especificaciones del Sistema

### Documentación de Dominio (Fuente de Verdad)

Antes de escribir una línea de código, **lee estos tres documentos** en `docs/`:

| Archivo | Contenido |
|---------|----------|
| `docs/Descripcion.txt` | Visión general, actores del sistema, reglas de negocio, stack tecnológico |
| `docs/Integrador.txt` | Arquitectura en capas, ERD (Entity-Relationship Diagram), especificación API REST, patrones de diseño |
| `docs/Historias_de_usuario.txt` | US-000 a US-076 con criterios de aceptación, reglas de negocio, campos, relaciones |

**Estos documentos son la fuente de verdad del sistema.**

### Especificaciones en OPSX

Las especificaciones se versionan en `openspec/specs/`:

```
openspec/specs/
├── authentication/spec.md
├── catalog/spec.md
├── shopping/spec.md
├── payments/spec.md
├── admin/spec.md
└── addresses/spec.md
```

Cada `spec.md` describe:
- Qué debe implementarse (modelos, endpoints, flujos)
- Restricciones y reglas de negocio
- Formato de datos (schemas, validaciones)
- Cambios previos (delta desde versión anterior)

---

## Arquitectura Frontend

### Estructura de Carpetas

```
frontend/src/
├── app/                              # Raíz de la aplicación
│   ├── App.tsx                       # Componente principal
│   ├── App.css                       # Estilos globales
│   └── main.tsx                      # Entry point
│
├── entities/                         # Modelos de dominio (types, interfaces)
│   ├── user.ts                       # Usuario (id, email, roles)
│   ├── product.ts                    # Producto (id, nombre, precio, stock)
│   ├── category.ts                   # Categoría
│   ├── cart.ts                       # Carrito
│   ├── order.ts                      # Pedido
│   └── payment.ts                    # Pago
│
├── features/                         # Módulos funcionales (feature-sliced)
│   ├── auth/
│   │   ├── store/                    # Zustand store para autenticación
│   │   ├── components/               # Componentes de auth
│   │   ├── api.ts                    # Llamadas API de auth
│   │   └── types.ts                  # Types locales
│   │
│   ├── cart/
│   │   ├── store/                    # Zustand store para carrito
│   │   ├── components/               # Componentes del carrito
│   │   └── api.ts                    # Llamadas API de carrito
│   │
│   ├── payment/
│   │   ├── store/                    # Zustand store para pagos
│   │   ├── components/               # Componentes de pago
│   │   └── api.ts                    # Llamadas API de pago
│   │
│   └── ui/
│       └── components/               # Componentes UI (botones, inputs, etc.)
│
├── pages/                            # Páginas de la aplicación
│   ├── HomePage.tsx
│   ├── ProductsPage.tsx
│   ├── CartPage.tsx
│   ├── CheckoutPage.tsx
│   ├── OrdersPage.tsx
│   ├── AdminPage.tsx
│   └── LoginPage.tsx
│
├── shared/                           # Recursos compartidos
│   ├── api/
│   │   ├── client.ts                 # Instancia de Axios
│   │   ├── endpoints.ts              # URLs de endpoints
│   │   └── interceptors.ts           # Interceptores HTTP
│   │
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorBoundary.tsx
│   │
│   ├── types/
│   │   ├── api.ts                    # Tipos de respuestas API
│   │   └── common.ts                 # Tipos comunes
│   │
│   └── utils/
│       ├── formatters.ts             # Formateo de datos
│       ├── validators.ts             # Validación
│       └── storage.ts                # LocalStorage helpers
│
└── widgets/                          # Componentes de página complejos
    ├── Header.tsx
    ├── Footer.tsx
    └── Sidebar.tsx
```

### Patrones de Arquitectura

#### ✅ Feature-Sliced Design (FSD)
- Cada feature es **autónoma** y contiene sus tipos, componentes, API y state
- No hay imports cruzados entre features
- Imports permitidos: `entities/` → `shared/` → `app/`

#### ✅ State Management con Zustand
```typescript
// features/auth/store/authStore.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  login: async (email, password) => {
    // Llamar API
    set({ user, token });
  },
  logout: () => set({ user: null, token: null }),
}));
```

#### ✅ Server State con TanStack Query
```typescript
// features/products/api.ts
import { useQuery } from '@tanstack/react-query';

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => apiClient.get('/products'),
  });
};
```

#### ✅ Componentes TypeScript
```typescript
// features/cart/components/CartItem.tsx
interface CartItemProps {
  id: string;
  name: string;
  price: number;
  quantity: number;
  onRemove: (id: string) => void;
  onQuantityChange: (id: string, quantity: number) => void;
}

export const CartItem: React.FC<CartItemProps> = ({
  id,
  name,
  price,
  quantity,
  onRemove,
  onQuantityChange,
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div>
        <h3 className="font-semibold">{name}</h3>
        <p className="text-gray-600">${price.toFixed(2)}</p>
      </div>
      {/* ... */}
    </div>
  );
};
```

---

## Arquitectura Backend

### Estructura de Capas

```
backend/app/
│
├── main.py                          # Punto de entrada FastAPI
│
├── core/                            # Configuración y utilidades compartidas
│   ├── config.py                    # Variables de entorno
│   ├── security.py                  # JWT, hashing, dependencias auth
│   ├── exceptions.py                # Excepciones custom
│   └── dependencies.py              # Dependencias de FastAPI (DB session, user actual)
│
├── db/                              # Capa de datos
│   ├── engine.py                    # Conexión a BD
│   ├── session.py                   # Session factory
│   ├── seed.py                      # Seed de datos iniciales
│   └── migrations/                  # Alembic migrations
│
├── models/                          # Modelos SQLModel (ORM)
│   ├── user.py                      # Usuario (id, email, password_hash, roles)
│   ├── product.py                   # Producto (id, nombre, precio, stock)
│   ├── category.py                  # Categoría
│   ├── ingredient.py                # Ingrediente
│   ├── cart_item.py                 # Item del carrito
│   ├── order.py                     # Pedido (estado, fecha, total)
│   ├── order_item.py                # Item del pedido
│   ├── payment.py                   # Pago (MP ID, estado, monto)
│   ├── address.py                   # Dirección de entrega
│   └── refresh_token.py             # Tokens de refresco
│
├── repositories/                    # Data access layer (DAO)
│   ├── user_repository.py           # CRUD de usuarios
│   ├── product_repository.py        # CRUD de productos
│   ├── order_repository.py          # CRUD de pedidos
│   └── base_repository.py           # Base con operaciones comunes
│
├── auth/                            # US-001: Autenticación
│   ├── router.py                    # Endpoints: /auth/login, /auth/register, /auth/refresh
│   ├── schemas.py                   # Request/response schemas
│   └── service.py                   # Lógica de autenticación
│
├── usuarios/                        # Gestión de usuarios
│   ├── router.py                    # Endpoints: /users/me, /users/{id}, etc.
│   ├── schemas.py                   # Schemas de usuario
│   └── service.py                   # Lógica de usuarios
│
├── categorias/                      # US-002: Categorías
│   ├── router.py                    # Endpoints: GET, POST /categories
│   ├── schemas.py                   # Schemas de categoría
│   └── service.py                   # Lógica de categorías
│
├── productos/                       # US-003: Productos
│   ├── router.py                    # Endpoints: CRUD /products
│   ├── schemas.py                   # Schemas de producto
│   └── service.py                   # Lógica de productos
│
├── ingredientes/                    # Ingredientes (componente de producto)
│   ├── router.py
│   ├── schemas.py
│   └── service.py
│
├── pedidos/                         # US-005: Pedidos
│   ├── router.py                    # Endpoints: CRUD /orders
│   ├── schemas.py                   # Schemas de pedido
│   ├── service.py                   # Lógica de pedidos
│   └── enums.py                     # Estados: PENDING, CONFIRMED, DELIVERED, CANCELLED
│
├── pagos/                           # US-006: Pagos MercadoPago
│   ├── router.py                    # Endpoints: POST /payments, webhooks
│   ├── schemas.py                   # Schemas de pago
│   ├── service.py                   # Lógica de pagos
│   └── mercadopago_service.py       # Integración con MP API
│
├── direcciones/                     # US-008: Direcciones
│   ├── router.py                    # Endpoints: CRUD /addresses
│   ├── schemas.py                   # Schemas de dirección
│   └── service.py                   # Lógica de direcciones
│
├── refreshtokens/                   # Gestión de refresh tokens
│   ├── router.py
│   ├── schemas.py
│   └── service.py
│
└── admin/                           # US-007: Panel administrativo
    ├── router.py                    # Endpoints: /admin/stats, /admin/orders, etc.
    ├── schemas.py
    └── service.py
```

### Patrón de Implementación de Módulos

Cada módulo (ej: `productos/`) sigue este patrón:

#### `router.py` - Endpoints FastAPI
```python
from fastapi import APIRouter, Depends, HTTPException
from . import schemas, service
from ..core.dependencies import get_current_user

router = APIRouter(prefix="/products", tags=["products"])

@router.get("/")
async def list_products(skip: int = 0, limit: int = 10):
    """Listar productos con paginación"""
    return await service.list_products(skip, limit)

@router.get("/{id}")
async def get_product(id: str):
    """Obtener producto por ID"""
    product = await service.get_product(id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product

@router.post("/")
async def create_product(
    product: schemas.ProductCreate,
    current_user: schemas.User = Depends(get_current_user)
):
    """Crear nuevo producto (solo admin)"""
    if "admin" not in current_user.roles:
        raise HTTPException(status_code=403, detail="Sin permisos")
    return await service.create_product(product)
```

#### `schemas.py` - Pydantic models
```python
from pydantic import BaseModel, Field
from typing import Optional

class ProductBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    stock: int = Field(..., ge=0)
    category_id: str

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None

class ProductResponse(ProductBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True
```

#### `service.py` - Lógica de negocio
```python
from ..db.session import get_db
from ..models import Product
from . import schemas

async def list_products(skip: int = 0, limit: int = 10):
    async with get_db() as db:
        products = db.query(Product).offset(skip).limit(limit).all()
        return products

async def create_product(product: schemas.ProductCreate):
    async with get_db() as db:
        db_product = Product(**product.dict())
        db.add(db_product)
        await db.commit()
        return db_product
```

### Patrones Clave

#### ✅ Inyección de Dependencias con FastAPI
```python
# core/dependencies.py
from fastapi import Depends, HTTPException
from ..core.security import decode_token
from ..models import User

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Dependencia para obtener usuario autenticado"""
    payload = decode_token(token)
    user = db.query(User).filter(User.id == payload['sub']).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user

# router.py
@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user
```

#### ✅ Manejo de Errores Personalizado
```python
# core/exceptions.py
from fastapi import HTTPException

class ResourceNotFoundError(HTTPException):
    def __init__(self, resource: str, id: str):
        super().__init__(
            status_code=404,
            detail=f"{resource} con ID {id} no encontrado"
        )

class UnauthorizedError(HTTPException):
    def __init__(self, message: str = "No autenticado"):
        super().__init__(status_code=401, detail=message)
```

#### ✅ Validación con Pydantic
```python
from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=3)
    
    @validator('password')
    def password_must_have_special_char(cls, v):
        if not any(char in v for char in "!@#$%^&*"):
            raise ValueError('Contraseña debe contener carácter especial')
        return v
```

#### ✅ Transacciones y Atomicidad
```python
async def create_order_with_items(order_data: dict, items: list):
    """Crear pedido con items en una transacción atómica"""
    async with get_db() as db:
        try:
            db_order = Order(**order_data)
            db.add(db_order)
            db.flush()  # Obtener ID sin commit
            
            for item in items:
                db_item = OrderItem(order_id=db_order.id, **item)
                db.add(db_item)
            
            await db.commit()
            return db_order
        except Exception as e:
            await db.rollback()
            raise
```

---

## Convenciones de Código

### Commits

Usa **conventional commits** para mantener historial claro:

```bash
# Features nuevas
git commit -m "feat(auth): implementar JWT con refresh tokens"

# Fixes de bugs
git commit -m "fix(products): corregir cálculo de stock en carrito"

# Refactoring
git commit -m "refactor(orders): extraer lógica de FSM a service"

# Tests
git commit -m "test(auth): agregar tests de refresh token"

# Documentación
git commit -m "docs(api): actualizar documentación de autenticación"

# Cambios de configuración
git commit -m "chore(config): actualizar variables de entorno"
```

### Nombres de Ramas

```bash
# Para features
git checkout -b feature/us-002-categorias

# Para fixes
git checkout -b fix/carrito-stock-negativo

# Para changes OPSX
git checkout -b change/us-002-categorias
```

### Python (Backend)

#### Convenciones de Nombres
```python
# Constantes: UPPER_SNAKE_CASE
MAX_ITEMS_PER_PAGE = 100
DATABASE_TIMEOUT = 30

# Funciones y métodos: lower_snake_case
def get_user_by_email(email: str) -> User:
    pass

# Clases: PascalCase
class ProductService:
    pass

# Privados: _underscore_prefix
def _validate_password(password: str) -> bool:
    pass
```

#### Type Hints Obligatorios
```python
# ✅ Bueno
def create_product(
    name: str,
    price: float,
    stock: int
) -> Product:
    pass

# ❌ Malo
def create_product(name, price, stock):
    pass
```

#### Docstrings
```python
def calculate_order_total(items: list[OrderItem]) -> float:
    """
    Calcular total de un pedido.
    
    Args:
        items: Lista de items del pedido
        
    Returns:
        float: Total en pesos
        
    Raises:
        ValueError: Si la lista está vacía
    """
    if not items:
        raise ValueError("Pedido sin items")
    return sum(item.price * item.quantity for item in items)
```

### TypeScript (Frontend)

#### Convenciones de Nombres
```typescript
// Constantes: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const API_TIMEOUT = 30000;

// Variables y funciones: camelCase
const userName = "john";
function getUserById(id: string): User {
  return {};
}

// Tipos e Interfaces: PascalCase
interface UserDTO {
  id: string;
  email: string;
}

type StatusType = "pending" | "confirmed" | "delivered";

// Componentes: PascalCase
function ProductCard(): React.ReactNode {
  return <div />;
}

// Archivos de store: camelCase
// features/auth/store/authStore.ts
```

#### Type Annotations Obligatorias
```typescript
// ✅ Bueno
const users: User[] = [];
const handleClick = (id: string): void => {
  console.log(id);
};

// ❌ Malo
const users = [];
const handleClick = (id) => {
  console.log(id);
};
```

#### Eslint + Prettier
Todos los cambios deben pasar:
```bash
npm run lint   # ESLint
npm run format # Prettier
```

---

## Instrucciones para Agentes de IA

### 🎯 Protocolo General

**Antes de escribir cualquier código**, siempre sigue este protocolo:

1. **Leer documentación de dominio** (`docs/`)
2. **Leer artefactos de OPSX** (`proposal.md`, `design.md`, `tasks.md`)
3. **Leer especificación existente** (`openspec/specs/<capability>/spec.md`)
4. **Entender estructura y patrones** (este archivo)
5. **Cargar skills relevantes** (ver abajo)
6. **Implementar según diseño, no por intuición**

### 📖 Lectura Obligatoria

Antes de implementar **cualquier feature**:

```bash
# 1. Leer descripción del sistema
cat docs/Descripcion.txt

# 2. Leer arquitectura
cat docs/Integrador.txt

# 3. Leer la user story específica
grep -A 50 "^US-XXX:" docs/Historias_de_usuario.txt

# 4. Si hay proposal.md, leerlo
cat openspec/changes/<change-name>/proposal.md

# 5. Si hay design.md, leerlo
cat openspec/changes/<change-name>/design.md

# 6. Leer tasks.md para entender qué implementar
cat openspec/changes/<change-name>/tasks.md

# 7. Leer spec.md para entender la especificación
cat openspec/specs/<capability>/spec.md
```

### 🔧 Skills Relevantes por Contexto

Carga estos skills según lo que estés haciendo:

#### Backend (FastAPI)
```
/skill fastapi
/skill api-authentication
/skill api-design-principles
/skill database-expert
/skill secure-auth
/skill testing-apis
```

#### Frontend (React + TypeScript)
```
/skill api-design-principles
/skill testing-apis
```

#### Base de Datos
```
/skill database-expert
/skill database
```

#### Autenticación + Seguridad
```
/skill api-authentication
/skill jwt-authentication
/skill secure-auth
```

### 📝 Workflow al Implementar

#### Paso 1: Entender la Tarea
```
Lee TODOS estos archivos:
1. docs/Descripcion.txt - Contexto del sistema
2. docs/Integrador.txt - Arquitectura
3. docs/Historias_de_usuario.txt - US específica
4. openspec/changes/<change>/proposal.md - Qué se hace
5. openspec/changes/<change>/design.md - Cómo se implementa
6. openspec/changes/<change>/tasks.md - Tareas específicas
7. openspec/specs/<capability>/spec.md - Especificación
```

#### Paso 2: Cargar Skills Relevantes
```
- Para endpoints API → /skill fastapi + api-design-principles
- Para autenticación → /skill api-authentication + secure-auth
- Para base de datos → /skill database-expert
- Para tests → /skill testing-apis
```

#### Paso 3: Crear Rama y Implementar
```bash
git checkout -b change/us-XXX-descripcion

# Implementar según design.md y tasks.md
# Seguir patrones de AGENTS.md

# Tests
npm run test:backend
npm run test:frontend

# Validación
npm run lint
npm run format
```

#### Paso 4: Commit por Tarea
```bash
# Cada tarea completada es un commit
git commit -m "feat(modulo): descripción específica según task"
```

#### Paso 5: Push y PR
```bash
git push origin change/us-XXX-descripcion

# Crear PR con descripción basada en proposal.md y design.md
```

### 🚨 Validaciones Críticas

Antes de hacer commit, **valida**:

#### Backend
```bash
# ✅ Tipos Python correctos
mypy backend/app

# ✅ Pruebas pasan
pytest backend

# ✅ Linting
pylint backend/app

# ✅ Migración DB si cambiaste modelos
alembic revision --autogenerate -m "Descripción"
alembic upgrade head
```

#### Frontend
```bash
# ✅ TypeScript compila
npm run build

# ✅ ESLint pasa
npm run lint

# ✅ Prettier formatea
npm run format

# ✅ Tests pasan
npm run test
```

### 🎓 Patrones a Seguir

#### Backend: Estructura de Módulo
```
backend/app/modulo/
├── router.py       # Endpoints FastAPI
├── schemas.py      # Pydantic models
├── service.py      # Lógica de negocio
└── __init__.py
```

#### Frontend: Feature-Sliced Design
```
frontend/src/features/feature/
├── api.ts          # Llamadas HTTP
├── components/     # Componentes
├── store/          # Zustand store
└── types.ts        # TypeScript types
```

#### Test: Cobertura Mínima
- Backend: 80% de cobertura (modelos, servicios, endpoints)
- Frontend: 70% de cobertura (hooks, componentes, stores)

### ⚠️ Errores Comunes a Evitar

❌ **No hagas esto:**

1. **Implementar sin leer `design.md`**
   - Puedes saltarte patrones críticos
   - Genera código incompatible

2. **Ignorar especificaciones en `spec.md`**
   - Las specs definen el contrato de datos
   - Cambiarlo rompe otras features

3. **Agregar dependencias sin discutir**
   - Cada librería suma peso y mantenimiento
   - Usa las de `requirements.txt` y `package.json`

4. **Saltear tests**
   - 80%+ cobertura es obligatorio
   - Los tests son documentación viva

5. **Commits sin mensaje descriptivo**
   - "fix bug" no explica nada
   - Usa conventional commits

6. **No sincronizar `spec.md` al terminar**
   - El cambio no queda documentado
   - La próxima feature no tiene contexto

7. **Modificar models/schemas sin migración DB**
   - Rompe integridad de datos
   - Usa Alembic para migraciones

### ✅ Checklist Antes de Hacer Commit

```
[ ] Leí todos los artefactos (docs/, proposal.md, design.md, tasks.md, spec.md)
[ ] Cargué los skills relevantes
[ ] El código sigue los patrones de AGENTS.md
[ ] Tests pasan (backend: pytest, frontend: npm test)
[ ] Linting pasa (pylint, npm run lint)
[ ] Formatter pasó (prettier)
[ ] Type checks pasan (mypy, TypeScript compiler)
[ ] Mensaje de commit es descriptivo (conventional commits)
[ ] Si cambié modelos BD, hice migración Alembic
[ ] Si cambié especificación, actualicé spec.md
[ ] Documenté cambios complejos en código
```

---

## Guía de Seguridad

### Autenticación

- **JWT con RS256** (asimetría)
- **Refresh tokens separados** en DB (invalidables)
- **Expiraciones**:
  - Access token: 30 minutos
  - Refresh token: 7 días
- **Hashing de passwords**: bcrypt con salt (no plain text)
- **HTTPS obligatorio** en producción

### CORS

```python
# core/config.py
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Rate Limiting

```python
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)

@router.post("/auth/login")
@limiter.limit("5/minute")
async def login(request: Request, credentials: LoginSchema):
    # Máximo 5 intentos de login por minuto
    pass
```

### Validación de Input

```python
# schemas.py - Pydantic valida automáticamente
class ProductCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    price: float = Field(..., gt=0)  # Mayor a 0
    stock: int = Field(..., ge=0)    # Mayor o igual a 0
```

### Variables Sensibles

**Nunca commitear**:
- `.env` (archivos locales)
- Tokens de API
- Contraseñas de DB
- Keys privadas

**Usar `.env.example`**:
```env
# backend/.env.example
DATABASE_URL=postgresql://user:password@localhost:5432/foodstore
SECRET_KEY=<tu-clave-secreta-aqui>
MP_ACCESS_TOKEN=<tu-token-aqui>
```

### Validación en Endpoints

```python
# Todos los endpoints deben validar entrada
@router.post("/products")
async def create_product(
    product: ProductCreate,  # Pydantic valida automáticamente
    current_user: User = Depends(get_current_user),  # Auth requerido
):
    # Validar permiso
    if "admin" not in current_user.roles:
        raise HTTPException(status_code=403)
    
    # Crear
    return await service.create_product(product)
```

---

## Variables de Entorno

### Backend

Crear `backend/.env` a partir de `backend/.env.example`:

```env
# Base de Datos
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/foodstore

# JWT
SECRET_KEY=tu-clave-secreta-de-64-caracteres-minimo
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# MercadoPago (obtener de https://www.mercadopago.com/developers)
MP_ACCESS_TOKEN=TEST-tu-token-de-mercadopago
MP_PUBLIC_KEY=TEST-tu-public-key-de-mercadopago

# CORS
CORS_ORIGINS=http://localhost:5173

# Entorno
ENVIRONMENT=development
```

### Frontend

Crear `frontend/.env` a partir de `frontend/.env.example`:

```env
# API Backend
VITE_API_URL=http://localhost:8000

# MercadoPago
VITE_MP_PUBLIC_KEY=TEST-tu-public-key-de-mercadopago
```

---

## Recursos Adicionales

- 📚 **Documentación del dominio**: `docs/`
- 🔧 **Skills instaladas**: `.agents/SKILLS.md`
- 📋 **Changes activos**: `openspec/changes/`
- 📝 **Especificaciones**: `openspec/specs/`
- 🚀 **Inicio rápido**: `README.md`

---

## Contacto y Preguntas

Si algo no está claro en este documento:

1. Revisa los documentos de `docs/`
2. Consulta el cambio específico en `openspec/changes/`
3. Lee el spec.md correspondiente
4. Carga las skills relevantes y pide ayuda

**Última actualización**: 2026-05-08  
**Versión**: 1.0  
**Mantenedores**: Equipo de desarrollo
