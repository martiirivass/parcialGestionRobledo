# Proposal: US-000-setup — Infraestructura Base

## ¿Qué?

Configuración inicial de la infraestructura del proyecto Food Store, incluyendo:
- Estructura del monorepo (backend + frontend)
- Configuración del entorno backend (FastAPI, SQLModel, Alembic)
- Base de datos PostgreSQL con migraciones y seed data
- Configuración del entorno frontend (React, Vite, TypeScript)
- Patrones de infraestructura (BaseRepository, Unit of Work)
- Stores de estado del cliente (Zustand)

## ¿Por qué?

Sin esta基础设施 NO se puede construir nada. Es la fundación sobre la que se construye todo el sistema. Todas las User Stories posteriores dependen directa o indirectamente de US-000.

## Dependencias

Ninguna. Es la User Story inicial del proyecto.

## Scope

### Backend (US-000a, US-000b, US-000d)
1. Estructura feature-first con módulos: auth, usuarios, productos, categorias, ingredientes, pedidos, pagos, direcciones, admin, refreshtokens
2. FastAPI con CORS, rate limiting, routers con prefijo `/api/v1`
3. PostgreSQL con 16 tablas según ERD v5
4. Migraciones Alembic con campos de auditoría y soft delete
5. Seed data: 4 Roles, 6 Estados de Pedido, Formas de pago, usuario admin
6. BaseRepository[T] genérico
7. Unit of Work como context manager
8. Dependencias: get_current_user, require_role

### Frontend (US-000c, US-000e)
1. Estructura FSD: app, pages, widgets, features, entities, shared
2. React + TypeScript + Vite + Tailwind CSS
3. Axios con interceptores (token, refresh)
4. TanStack Query configurado
5. Zustand stores: authStore, cartStore, paymentStore, uiStore
6. Routing con react-router-dom

## Exclusiones

- No se implementa funcionalidad de negocio (auth, productos, pedidos, etc.)
- No se crea UI más allá de la estructura base
- No se conecta con MercadoPago (solo configuración de variables)

## Riesgo

Bajo - Es infraestructura estándar, sin lógica de negocio compleja.

## Estimación

4-6 horas para un desarrollador experimentado.

## Prioridad

ALTA - Sin esto no existe el proyecto.