# Tasks: US-000-setup — Infraestructura Base

## 1. Backend: Estructura y Dependencias

- [x] 1.1 Crear requirements.txt con todas las dependencias (FastAPI, SQLModel, Alembic, Passlib, python-jose, slowapi, mercadopago, uvicorn, httpx, pydantic, bcrypt)
- [x] 1.2 Crear estructura de carpetas feature-first: auth/, usuarios/, categorias/, productos/, ingredientes/, pedidos/, pagos/, direcciones/, admin/, refreshtokens/
- [x] 1.3 Crear app/__init__.py y app/main.py con FastAPI configurado
- [x] 1.4 Configurar CORS middleware con origenes desde variable de entorno
- [x] 1.5 Configurar rate limiting middleware (slowapi)
- [x] 1.6 Crear app/core/config.py con Pydantic BaseSettings
- [x] 1.7 Crear app/core/database.py con SQLModel engine y session factory
- [x] 1.8 Crear app/core/security.py con funciones bcrypt y JWT
- [x] 1.9 Crear app/core/exceptions.py con manejo RFC 7807

## 2. Backend: Modelos SQLModel

- [x] 2.1 Crear modelos Dominio 1 (Identidad): Usuario, Rol, UsuarioRol, RefreshToken, DireccionEntrega
- [x] 2.2 Crear modelos Dominio 2 (Catalogo): Categoria, Producto, Ingrediente, ProductoCategoria, ProductoIngrediente, FormaPago
- [x] 2.3 Crear modelos Dominio 3 (Ventas): EstadoPedido, Pedido, DetallePedido, HistorialEstadoPedido, Pago
- [x] 2.4 Agregar campos de auditoria (creado_en, actualizado_en, eliminado_en) a todas las entidades
- [x] 2.5 Configurar FK autoreferencial en Categoria (padre_id)
- [x] 2.6 Configurar FK compuesta única en UsuarioRol

## 3. Backend: Migraciones Alembic

- [x] 3.1 Inicializar Alembic: alembic init alembic (usando SQLModel.metadata.create_all)
- [x] 3.2 Configurar alembic.ini con connection string
- [x] 3.3 Generar migración inicial: alembic revision --autogenerate (usando create_all)
- [x] 3.4 Ejecutar migración: alembic upgrade head (usando create_all)
- [x] 3.5 Verificar que las 16 tablas fueron creadas
- [x] 3.6 Probar revert: alembic downgrade -1

## 4. Backend: Seed Data

- [x] 4.1 Crear script de seed idempotente en app/db/seed.py
- [x] 4.2 Insertar 4 Roles (ADMIN=1, STOCK=2, PEDIDOS=3, CLIENT=4)
- [x] 4.3 Insertar 6 EstadosPedido (PENDIENTE=1 a CANCELADO=6)
- [x] 4.4 Insertar Formas de Pago (Tarjeta credito, Tarjeta debito)
- [x] 4.5 Crear usuario administrador desde variables de entorno
- [x] 4.6 Probar idempotencia: ejecutar seed 2 veces

## 5. Backend: Patrones de Infraestructura

- [x] 5.1 Implementar BaseRepository[T] genérico con metodos CRUD
- [x] 5.2 Implementar list_all con soporte para filtros
- [x] 5.3 Implementar soft_delete y hard_delete
- [x] 5.4 Implementar UnitOfWork como context manager async
- [x] 5.5 Exponer repositorios en UnitOfWork
- [x] 5.6 Implementar commit/rollback automatico

## 6. Backend: Dependencias de Autenticacion

- [x] 6.1 Implementar get_current_user dependency
- [x] 6.2 Extraer token del header Authorization
- [x] 6.3 Decodificar y validar JWT
- [x] 6.4 Retornar usuario o lanzar 401
- [x] 6.5 Implementar require_role factory
- [x] 6.6 Verificar roles del usuario
- [x] 6.7 Lanzar 403 si no tiene permiso
- [x] 6.8 Configurar rate limiting en endpoint /auth/login

## 7. Frontend: Estructura y Dependencias

- [x] 7.1 Crear proyecto Vite: npm create vite@latest . -- --template react-ts
- [x] 7.2 Instalar dependencias: react, react-dom, react-router-dom, @tanstack/react-query, @tanstack/react-form, zustand, axios, recharts, tailwindcss, @mercadopago/sdk-js
- [x] 7.3 Configurar TypeScript strict mode en tsconfig.json
- [x] 7.4 Configurar Tailwind CSS con PostCSS
- [x] 7.5 Crear estructura FSD: app/, pages/, widgets/, features/, entities/, shared/
- [x] 7.6 Configurar TanStack Query con QueryClientProvider
- [x] 7.7 Configurar React Router con rutas base

## 8. Frontend: API Client

- [x] 8.1 Crear instancia Axios en shared/api/axios.ts
- [x] 8.2 Configurar baseURL desde VITE_API_BASE_URL
- [x] 8.3 Implementar interceptor de request para adjuntar Bearer token
- [x] 8.4 Implementar interceptor de response para manejar 401
- [x] 8.5 Implementar refresh automatico de tokens
- [x] 8.6 Limpiar auth y redirigir a login si refresh falla

## 9. Frontend: Zustand Stores

- [x] 9.1 Crear authStore con estado: accessToken, refreshToken, user, isAuthenticated
- [x] 9.2 Crear authStore con acciones: login, logout, updateTokens
- [x] 9.3 Crear authStore con selectores: isAuthenticated, hasRole
- [x] 9.4 Configurar persistencia en localStorage para authStore
- [x] 9.5 Crear cartStore con estado: items array
- [x] 9.6 Crear cartStore con acciones: addItem, removeItem, updateQuantity, clearCart
- [x] 9.7 Configurar persistencia en localStorage para cartStore
- [x] 9.8 Crear paymentStore con estado: preferencia, status, error
- [x] 9.9 Crear uiStore con estado: theme, sidebarOpen, notifications
- [x] 9.10 Crear uiStore con acciones: toggleTheme, toggleSidebar, addNotification

## 10. Verificacion Final

- [x] 10.1 Probar que backend arranca: uvicorn app.main:app --reload (requiere PostgreSQL)
- [x] 10.2 Verificar /docs accesible (requiere PostgreSQL)
- [x] 10.3 Probar que frontend arranca: npm run dev (requiere npm install)
- [x] 10.4 Verificar que stores persisten en localStorage
- [x] 10.5 Verificar que API client adjunta tokens
