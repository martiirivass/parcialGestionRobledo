# Proposal: US-001-auth

## Why

The Food Store platform requires a secure authentication and user registration system as the foundational capability that gates access to all subsequent features. Without authentication, clients cannot create accounts, place orders, or access personalized features, and administrators cannot manage the system. This is the first critical piece that must be implemented before any user-facing or admin functionality can be deployed.

## What Changes

- **New endpoint** `POST /api/v1/auth/register` to allow new clients to create accounts with email and password validation
- **New endpoint** `POST /api/v1/auth/login` to authenticate users and issue JWT tokens (access + refresh)
- **New endpoint** `POST /api/v1/auth/refresh` to renew expired access tokens using refresh tokens with rotation
- **New endpoint** `POST /api/v1/auth/logout` to invalidate refresh tokens and terminate sessions
- **New database models** for User, Role, UsuarioRol (M2M), and RefreshToken with proper hashing and token storage
- **Rate limiting** on login endpoint (5 attempts per IP per 15 minutes) to prevent brute force attacks
- **Password hashing** with bcrypt (cost factor ≥ 10) — passwords are never stored in plaintext
- **JWT tokens** with access token (30 min) and refresh token (7 days) with rotation on refresh
- **Automatic role assignment** of CLIENT role to new registrants
- **Token validation dependencies** in FastAPI to protect routes and extract current user

## Capabilities

### New Capabilities
- `user-authentication`: JWT-based authentication with access/refresh token duality, token rotation on refresh, and stateless validation via JWT claims
- `user-registration`: User account creation with email uniqueness validation, password hashing with bcrypt, and automatic CLIENT role assignment
- `refresh-token-management`: Secure refresh token lifecycle with DB-backed invalidation, replay attack detection, and rotation to limit exposure windows
- `rate-limiting-auth`: HTTP 429 rate limiting on login endpoint to prevent brute force (5 attempts/15min per IP)
- `user-authorization-foundation`: Role-based access control (RBAC) foundation with four roles (ADMIN, STOCK, PEDIDOS, CLIENT) and FastAPI dependencies for role verification

### Modified Capabilities
- None (this is foundational)

## Impact

**Backend**:
- Creates `app/auth/` module with router, service, schema, and repository
- Adds User, Role, UsuarioRol, RefreshToken models to `app/models/`
- Implements BaseRepository and UnitOfWork patterns in `app/core/`
- Configures JWT secrets and token expiry times in environment variables
- Adds rate limiting middleware to FastAPI app

**Frontend**:
- Creates `features/auth/` with authStore (Zustand), login/register forms, and JWT interceptor in Axios
- Establishes pattern for protected routes and token persistence in localStorage

**Database**:
- Requires Alembic migration to create Usuario, Rol, UsuarioRol, RefreshToken tables with proper constraints
- Seed data to populate 4 roles (ADMIN, STOCK, PEDIDOS, CLIENT)

**Dependencies**:
- Requires prior completion of US-000a (FastAPI setup), US-000b (DB migrations), US-000d (BaseRepository pattern)
