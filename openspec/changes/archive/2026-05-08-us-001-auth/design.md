# Design: US-001-auth

## Context

The Food Store backend uses FastAPI with SQLModel for the ORM and follows a layered architecture (Router → Service → UnitOfWork → Repository → Model). The frontend is built with React + TypeScript + Zustand for state management. Authentication is the first secured capability — without it, subsequent features like cart, orders, and payments cannot restrict access properly.

The system must support:
- JWT-based stateless authentication to avoid session overhead
- Refresh token rotation to limit exposure of stolen tokens
- Role-Based Access Control (RBAC) with 4 roles that will be checked on protected endpoints
- Password security with bcrypt hashing
- Rate limiting to prevent brute force attacks on login

## Goals / Non-Goals

**Goals:**
- Implement secure password hashing with bcrypt (cost ≥ 10)
- Issue JWT access tokens (30 min) and refresh tokens (7 days) on successful login/registration
- Implement refresh token rotation: each refresh invalidates the previous token and issues a new one
- Detect replay attacks: if a revoked refresh token is used, invalidate ALL tokens for that user
- Rate limit login to 5 attempts per IP per 15 minutes using slowapi
- Auto-assign CLIENT role to new registrants; ADMIN only assigns other roles
- Create BaseRepository and UnitOfWork patterns to enable transactional integrity for all modules

**Non-Goals:**
- Password reset / forgot password flow (future feature)
- OAuth 2.0 social login (future feature)
- LDAP / external identity provider integration (future feature)
- Account recovery via email (out of scope)

## Decisions

### Decision 1: JWT vs. Session-Based Authentication

**Choice:** JWT with stateless tokens

**Rationale:** 
- JWT is stateless, allowing horizontal scaling without shared session store
- Explicit token expiration in the payload (no server-side session table invalidation needed for normal expiry)
- Enables simple API rate limiting by IP (not tied to session state)

**Alternatives Considered:**
- Sessions with server-side Redis/DB storage: More overhead, requires shared cache in distributed systems
- OAuth 2.0: Overkill for internal API; adds complexity without benefit

### Decision 2: Dual Token Strategy (Access + Refresh)

**Choice:** Short-lived access token (30 min) + long-lived refresh token (7 days) with rotation

**Rationale:**
- Short access tokens minimize damage if stolen (30-min window)
- Refresh tokens are DB-backed (opaque UUIDs), allowing immediate revocation on logout or compromise
- Rotation on each refresh invalidates the previous token, limiting the window of exposure if a token is leaked
- Enables frontend to transparently refresh: axios interceptor detects 401 → calls refresh → retries request

**Alternatives Considered:**
- Single long-lived token: High risk if stolen; no refresh mechanic to rotate compromised tokens
- No refresh tokens: Requires user to re-login every 30 min; poor UX

### Decision 3: Refresh Token Storage

**Choice:** Store as opaque UUID in RefreshToken table with explicit revocation field (`revoked_at`)

**Rationale:**
- Unlike JWT, refresh tokens are not "attached" to users directly; they're DB records associated with a user
- Allows immediate invalidation on logout (set `revoked_at = NOW()`)
- Enables replay attack detection: if a revoked token is used, revoke ALL tokens for that user
- Avoids storing JWT refresh tokens in a blacklist (which defeats the purpose of stateless auth)

**Alternatives Considered:**
- Store refresh token hashes only: Prevents replay detection (can't distinguish between legitimate and leaked tokens)
- Store full refresh token UUIDs unhashed: Less secure if DB is compromised, but acceptable for internal API

### Decision 4: Replay Attack Detection

**Choice:** If a used/revoked refresh token is presented, revoke all tokens for that user

**Rationale:**
- Detects when a token family is compromised: if token X was used and then token X is used again, attacker has the DB record
- Immediately invalidates all family members to force re-authentication
- Requires tracking `family_id` on each refresh token to group related tokens

**Alternatives Considered:**
- Ignore replays: Dangerous; attacker could extract tokens and use them repeatedly
- Revoke only the current token: Insufficient; attacker might have multiple tokens from same family

### Decision 5: Backend Layered Architecture

**Choice:** Router → Service → UnitOfWork → Repository → Model with dependency injection

**Rationale:**
- Router handles HTTP concerns only (parsing, validation, serialization)
- Service contains business logic (hashing, token generation, validation)
- UnitOfWork manages transactional scope and repository access
- Repository abstracts data access; BaseRepository[T] provides generic CRUD
- Enables testing by swapping repositories and UoW with mocks

**Ordering:**
- Prevents circular dependencies: higher layers never import lower layers
- Makes mocking and testing straightforward

### Decision 6: Password Hashing Algorithm

**Choice:** bcrypt with cost factor ≥ 10 via Passlib

**Rationale:**
- bcrypt is industry-standard for password hashing
- Built-in salt generation and cost tuning (resists GPU attacks)
- Passlib library handles algorithm versioning and upgrades transparently

**Alternatives Considered:**
- Argon2: Overkill for this application; requires additional dependency
- PBKDF2: Acceptable but less resistant to GPU attacks than bcrypt

### Decision 7: Rate Limiting

**Choice:** slowapi library with 5 attempts per IP per 15 minutes on login endpoint

**Rationale:**
- slowapi integrates natively with FastAPI via decorators
- Uses in-memory storage (no Redis required for MVP)
- 5 attempts per 15 min is enough for legitimate users, blocks brute force
- Applied only to login (register doesn't need limiting in MVP)

**Alternatives Considered:**
- Custom middleware: More control but more maintenance
- Redis-backed rate limiting: Adds deployment complexity for MVP

### Decision 8: Frontend Token Persistence

**Choice:** Access token + refresh token in Zustand authStore with localStorage persistence

**Rationale:**
- authStore is the single source of truth for auth state in frontend
- localStorage survives page refresh (important for UX)
- Axios interceptor can extract token from store without React context (via `useAuthStore.getState()`)
- Refresh token refresh is automatic via interceptor 401 handler

**Alternatives Considered:**
- httpOnly cookie: No access from JS; prevents direct token inspection but requires different CORS handling
- sessionStorage: Lost on tab close; worse UX
- Memory only: Lost on refresh; forces re-login

### Decision 9: Automatic Role Assignment

**Choice:** New registrants automatically get CLIENT role; ADMIN only can assign other roles

**Rationale:**
- Prevents privilege escalation: users cannot grant themselves ADMIN during registration
- Clear separation: ADMIN explicitly manages roles via separate endpoint

### Decision 10: Error Messages

**Choice:** Login error response does NOT distinguish between "email not found" and "wrong password"

**Rationale:**
- Security: Prevents email enumeration attacks (attacker can't probe which emails are registered)
- Both cases return same 401 "Invalid email or password"

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| **If JWT secret is compromised** | All tokens become invalid. Rotate secret and force re-login. Consider using RS256 (asymmetric keys) in production. |
| **Refresh token database overhead** | Reading RefreshToken table on every refresh endpoint call. Mitigate: add index on (user_id, revoked_at). Refresh calls are less frequent than access token usage. |
| **In-memory rate limiting is not distributed** | If backend is scaled horizontally, each instance has separate rate limit counters. Mitigation: use Redis-backed slowapi in production. For MVP single instance is fine. |
| **Password hashing is CPU-intensive** | bcrypt cost ≥ 10 takes ~100ms per password check. Mitigation: acceptable for authentication endpoint; don't call on every request. |
| **localStorage is vulnerable to XSS** | If a script injection occurs, attacker can steal token. Mitigation: implement CSP headers, sanitize user inputs on frontend. Consider httpOnly cookies in future. |
| **Role check on every protected route** | Service must query user roles. Mitigation: roles are included in JWT claims, so no extra DB call needed (just validate against token). |
| **Refresh token rotation adds complexity** | Must track `family_id` and revocation state. Mitigation: clear schema, well-documented, tested with unit tests. |

## Implementation Details

### Backend Flow

```
POST /api/v1/auth/register
  ├─ Validate: email format, password length ≥ 8
  ├─ Check: email uniqueness (ServiceException if exists)
  ├─ Hash password with bcrypt(password, salt_rounds=12)
  ├─ Create User + assign CLIENT role via UsuarioRol
  ├─ Generate access token (30 min expiry) with user.id, user.email, user.roles
  ├─ Generate refresh token UUID, store in RefreshToken table with user_id, expires_at = NOW() + 7 days
  ├─ Return TokenResponse with both tokens + user info
  └─ StatusCode: 201

POST /api/v1/auth/login
  ├─ Rate limit: @limiter.limit("5/15 minutes") (by IP)
  ├─ Validate schema (email, password)
  ├─ Lookup User by email (include soft-deleted check)
  ├─ If not found → return 401 "Invalid credentials"
  ├─ Verify password hash matches
  ├─ If mismatch → return 401 "Invalid credentials"
  ├─ Load user roles from UsuarioRol
  ├─ Generate tokens (same as register)
  ├─ Return TokenResponse
  └─ StatusCode: 200

POST /api/v1/auth/refresh
  ├─ Extract refresh_token from body
  ├─ Query RefreshToken by token value
  ├─ If not found or revoked_at is NOT NULL → return 401
  ├─ If expired (expires_at < NOW()) → return 401
  ├─ Mark current token as revoked: UPDATE RefreshToken SET revoked_at = NOW() WHERE id = ...
  ├─ Generate new access token
  ├─ Generate new refresh token (new UUID, same family_id)
  ├─ Return TokenResponse with new tokens
  └─ StatusCode: 200

POST /api/v1/auth/logout
  ├─ Extract refresh token from body
  ├─ Mark as revoked: UPDATE RefreshToken SET revoked_at = NOW()
  ├─ Return 204 No Content
```

### Frontend Flow

```
authStore (Zustand):
  ├─ State: { accessToken, refreshToken, user, isAuthenticated }
  ├─ Actions: login(), logout(), updateTokens()
  ├─ Selectors: isAuthenticated(), hasRole(role)
  ├─ Persist: { accessToken, refreshToken } to localStorage

Axios Interceptor:
  ├─ Request: Attach `Authorization: Bearer ${authStore.accessToken}` to every request
  ├─ Response on 401:
  │   ├─ Call POST /auth/refresh with refreshToken
  │   ├─ On success: updateTokens() in authStore
  │   └─ Retry original request with new token
  │   ├─ On failure (401): logout(), redirect to login
  ├─ Response on other errors: pass through
```

## Migration Plan

**Deployment Steps:**
1. Deploy database migrations (Alembic: creates Usuario, Rol, UsuarioRol, RefreshToken tables)
2. Run seed script to populate 4 roles and admin user
3. Deploy backend with auth module
4. Deploy frontend with authStore and axios interceptor
5. Test manual flow: register → login → refresh → logout

**Rollback:**
- If backend fails: revert code, database schema remains (no destructive migrations)
- If seed fails: Alembic downgrade, fix, re-run
- If frontend fails: clear localStorage, revert code

## Open Questions

1. Should refresh token family_id tracking be added now, or defer to a later "audit trail" feature?
   - **Resolution:** Implement now; it's the proper way to detect replays per spec (RN-AU05)

2. Should password reset via email be included?
   - **Resolution:** Out of scope; future feature. Defer to US-063.

3. Should the admin user be created with a secure random password or hardcoded?
   - **Resolution:** Hardcoded in seed with instruction to change via env var. Documentation required.

4. Should we validate password complexity (uppercase, lowercase, numbers, symbols)?
   - **Resolution:** Minimum 8 characters for MVP. Complex validation can be added later if needed.
