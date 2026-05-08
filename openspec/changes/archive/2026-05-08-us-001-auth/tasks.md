# Tasks: US-001-auth

Implementation checklist for user authentication, registration, and RBAC foundation.

## 1. Database Models and Migrations

- [ ] 1.1 Create SQLModel for User with fields: id, nombre, email, password_hash, telefono, creado_en, actualizado_en, eliminado_en
- [ ] 1.2 Create SQLModel for Rol with fields: id, codigo (ADMIN/STOCK/PEDIDOS/CLIENT), nombre, descripcion
- [ ] 1.3 Create SQLModel for UsuarioRol (M2M) with fields: usuario_id, rol_id, unique constraint (usuario_id, rol_id)
- [ ] 1.4 Create SQLModel for RefreshToken with fields: id, token (UUID unique), user_id (FK), expires_at, revoked_at, family_id, created_at
- [ ] 1.5 Create Alembic migration to add all four tables with proper constraints and indexes
- [ ] 1.6 Create seed script to populate 4 Roles (ADMIN=1, STOCK=2, PEDIDOS=3, CLIENT=4) idempotently
- [ ] 1.7 Create seed script to populate admin user (admin@foodstore.com with CLIENT role initially, then ADMIN assigned)
- [ ] 1.8 Verify migration and seed run without errors: `alembic upgrade head && python -m app.db.seed`

## 2. Backend Core Infrastructure

- [ ] 2.1 Create BaseRepository[T] generic class in app/core/repository.py with methods: get_by_id, list_all, count, create, update, soft_delete, hard_delete
- [ ] 2.2 Create UnitOfWork class in app/core/uow.py as async context manager with __aenter__ and __aexit__
- [ ] 2.3 Add repository attributes to UoW for: usuarios, roles, usuario_roles, refresh_tokens
- [ ] 2.4 Implement UoW commit/rollback logic in __aexit__
- [ ] 2.5 Create AppException base class and subclasses (BadRequest, NotFound, Unauthorized, Forbidden, Conflict)
- [ ] 2.6 Create global exception handler middleware in app/main.py that formats errors as RFC 7807
- [ ] 2.7 Create security.py module with functions: hash_password, verify_password, create_access_token, create_refresh_token, decode_token
- [ ] 2.8 Create get_current_user dependency in app/core/dependencies.py that extracts and validates JWT
- [ ] 2.9 Create require_role factory dependency that checks if user has required role(s)
- [ ] 2.10 Add slowapi rate limiting middleware to main.py with 5 attempts/15 min on login

## 3. Backend Auth Module

- [ ] 3.1 Create app/auth/models.py with any local enums (if needed)
- [ ] 3.2 Create app/auth/schemas.py with: LoginRequest, RegisterRequest, TokenResponse, UserResponse, RefreshTokenRequest
- [ ] 3.3 Create app/auth/repository.py extending BaseRepository for auth-specific queries (find_user_by_email, etc.)
- [ ] 3.4 Create app/auth/service.py with stateless functions: register_user, authenticate_user, refresh_token_handler, logout_handler
- [ ] 3.5 Implement register_user: validate email uniqueness, hash password, create User, assign CLIENT role, generate tokens
- [ ] 3.6 Implement authenticate_user: lookup user by email, verify password, load roles, generate tokens
- [ ] 3.7 Implement refresh_token_handler: validate token exists/not revoked/not expired, rotate (revoke old, issue new), return new pair
- [ ] 3.8 Implement logout_handler: mark refresh token as revoked
- [ ] 3.9 Implement replay attack detection: if revoked token is used, revoke ALL tokens for that user
- [ ] 3.10 Create app/auth/router.py with endpoints: POST /register, POST /login, POST /refresh, POST /logout
- [ ] 3.11 Add @limiter.limit("5/15 minutes") to login endpoint via IP
- [ ] 3.12 Ensure login error response does NOT distinguish between "email not found" and "password wrong"
- [ ] 3.13 Add get_current_user dependency to /auth/me GET endpoint to verify auth works

## 4. Backend Testing

- [ ] 4.1 Create test file app/tests/test_auth.py with pytest fixtures for test user and tokens
- [ ] 4.2 Write test: successful registration returns 201 + tokens + user
- [ ] 4.3 Write test: duplicate email registration returns 409
- [ ] 4.4 Write test: invalid password length (< 8 chars) returns 422
- [ ] 4.5 Write test: successful login returns 200 + tokens + user
- [ ] 4.6 Write test: login with non-existent email returns 401 (same message as wrong password)
- [ ] 4.7 Write test: login with wrong password returns 401 (same message as non-existent email)
- [ ] 4.8 Write test: refresh with valid token returns 200 + new tokens
- [ ] 4.9 Write test: refresh with expired token returns 401
- [ ] 4.10 Write test: refresh with revoked token returns 401
- [ ] 4.11 Write test: replay attack detection revokes all tokens for user
- [ ] 4.12 Write test: logout marks refresh token as revoked
- [ ] 4.13 Write test: rate limiting on login blocks 6th attempt in 15 min

## 5. Frontend State Management (Zustand)

- [ ] 5.1 Create features/auth/store/authStore.ts with state: { accessToken, refreshToken, user, isAuthenticated }
- [ ] 5.2 Implement authStore actions: login(tokens, user), logout(), updateTokens(tokens)
- [ ] 5.3 Implement authStore selectors: isAuthenticated(), hasRole(role)
- [ ] 5.4 Configure persist middleware for authStore to save accessToken + refreshToken to localStorage
- [ ] 5.5 Ensure authStore excludes transient state (isLoading) from persistence

## 6. Frontend HTTP Client (Axios)

- [ ] 6.1 Create shared/api/axios.ts with Axios instance
- [ ] 6.2 Configure base URL from VITE_API_URL environment variable
- [ ] 6.3 Implement request interceptor that adds `Authorization: Bearer <accessToken>` header
- [ ] 6.4 Implement response interceptor that intercepts 401 errors
- [ ] 6.5 Response interceptor logic: on 401, call POST /auth/refresh with refreshToken
- [ ] 6.6 On refresh success: update authStore with new tokens, retry original request
- [ ] 6.7 On refresh failure (401): clear authStore, redirect to /login
- [ ] 6.8 Ensure axios instance extracts token from authStore using getState() (works outside React)

## 7. Frontend Auth Components

- [ ] 7.1 Create features/auth/components/LoginForm.tsx with email, password inputs
- [ ] 7.2 Implement LoginForm form handling with TanStack Form + validation
- [ ] 7.3 Implement LoginForm submission: call auth API, on success update authStore, redirect to home
- [ ] 7.4 Implement LoginForm error handling: display error messages from API
- [ ] 7.5 Create features/auth/components/RegisterForm.tsx with nombre, email, password, confirm password
- [ ] 7.6 Implement RegisterForm similar to LoginForm
- [ ] 7.7 Create features/auth/components/ProtectedRoute.tsx HOC that checks isAuthenticated and redirects to /login
- [ ] 7.8 Create features/auth/api.ts with login(), register(), refresh(), logout() functions
- [ ] 7.9 Add loading states to forms (disable buttons while submitting)

## 8. Frontend Pages and Routing

- [ ] 8.1 Create pages/LoginPage.tsx that renders LoginForm
- [ ] 8.2 Create pages/RegisterPage.tsx that renders RegisterForm
- [ ] 8.3 Configure React Router with route /login → LoginPage, /register → RegisterPage
- [ ] 8.4 Wrap protected pages with ProtectedRoute HOC
- [ ] 8.5 Add navigation links from login → register and vice versa

## 9. Integration and End-to-End Tests

- [ ] 9.1 Manual test: Register a new user → verify user created in DB with CLIENT role → tokens returned
- [ ] 9.2 Manual test: Login with new user → verify tokens returned + authStore populated
- [ ] 9.3 Manual test: Use access token in request to /api/auth/me → verify user data returned
- [ ] 9.4 Manual test: Wait 30 min or mock token expiration → call protected endpoint → verify 401 → interceptor refreshes → call succeeds
- [ ] 9.5 Manual test: Call logout → verify refresh token marked revoked in DB → next refresh fails
- [ ] 9.6 Manual test: Attempt 6 logins in 15 min from same IP → verify 429 rate limit error
- [ ] 9.7 Manual test: Page refresh after login → verify authStore restored from localStorage → user stays logged in
- [ ] 9.8 Manual test: Register with duplicate email → verify 409 error displayed
- [ ] 9.9 Manual test: Register with password < 8 chars → verify 422 validation error displayed
- [ ] 9.10 Manual test: Login with wrong password → verify 401 "Invalid credentials" (no email enumeration)

## 10. Documentation and Configuration

- [ ] 10.1 Update backend .env.example with: SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
- [ ] 10.2 Update frontend .env.example with: VITE_API_URL
- [ ] 10.3 Document JWT payload structure in README or architecture doc
- [ ] 10.4 Document role IDs and codes (ADMIN=1, etc.) in code comments
- [ ] 10.5 Add docstrings to all auth-related functions
- [ ] 10.6 Update API documentation: note that POST /auth/register and /login are public, others require Bearer token
