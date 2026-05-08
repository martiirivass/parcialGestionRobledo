# Specification: User Authentication

Delta spec for `user-authentication` capability introduced in US-001-auth.

## ADDED Requirements

### Requirement: User Registration
The system SHALL allow new clients to create an account by providing email, name, and password. The system SHALL validate input, hash the password with bcrypt (cost ≥ 10), assign the CLIENT role automatically, and return JWT tokens (access + refresh).

#### Scenario: Successful registration with valid credentials
- **WHEN** a client submits `POST /api/v1/auth/register` with `{ nombre: "Juan", email: "juan@example.com", password: "SecurePass123" }`
- **THEN** the system creates a User record, assigns CLIENT role, returns HTTP 201 with access token (30 min), refresh token (7 days), and user details

#### Scenario: Registration with duplicate email
- **WHEN** a client attempts to register with an email already in the system
- **THEN** the system returns HTTP 409 Conflict with message "El email ya está registrado"

#### Scenario: Registration with invalid password
- **WHEN** a client submits a password with fewer than 8 characters
- **THEN** the system returns HTTP 422 Unprocessable Entity with validation error

#### Scenario: Password is hashed with bcrypt
- **WHEN** a user is created during registration
- **THEN** the password_hash column contains a bcrypt hash (60 chars, cost ≥ 10) and the plaintext password is never stored

### Requirement: User Login
The system SHALL authenticate a user by email and password, verify credentials against the stored bcrypt hash, and return JWT tokens on success. The system SHALL NOT reveal whether the email exists or password is incorrect.

#### Scenario: Successful login with valid credentials
- **WHEN** a user submits `POST /api/v1/auth/login` with correct email and password
- **THEN** the system returns HTTP 200 with access token (30 min), refresh token (7 days), and user details including roles

#### Scenario: Login with non-existent email
- **WHEN** a user submits login with an email not in the system
- **THEN** the system returns HTTP 401 "Invalid email or password" (no distinction)

#### Scenario: Login with incorrect password
- **WHEN** a user submits login with correct email but wrong password
- **THEN** the system returns HTTP 401 "Invalid email or password" (same response as non-existent email)

#### Scenario: Rate limiting on login
- **WHEN** a user attempts 6 failed logins within 15 minutes from the same IP
- **THEN** the system returns HTTP 429 Too Many Requests with Retry-After header, blocking further attempts for that IP

#### Scenario: Rate limit resets after 15 minutes
- **WHEN** 15 minutes have passed since the last failed attempt
- **THEN** the rate limit counter resets and the user can attempt login again

### Requirement: Refresh Token Endpoint
The system SHALL accept a valid refresh token, verify it is not revoked and not expired, rotate it (invalidate the current, issue a new one), and return new JWT tokens. The system SHALL detect replay attacks and invalidate all tokens for the user if a revoked token is replayed.

#### Scenario: Successful token refresh
- **WHEN** a client submits `POST /api/v1/auth/refresh` with a valid, non-revoked, non-expired refresh token
- **THEN** the system returns HTTP 200 with a new access token, a new refresh token (rotated), and updates the RefreshToken record

#### Scenario: Refresh with expired token
- **WHEN** a client submits a refresh token whose `expires_at` has passed
- **THEN** the system returns HTTP 401 "Refresh token expired"

#### Scenario: Refresh with revoked token
- **WHEN** a client submits a refresh token marked as revoked (revoked_at IS NOT NULL)
- **THEN** the system returns HTTP 401 "Refresh token revoked"

#### Scenario: Replay attack detection
- **WHEN** a client submits a refresh token that was previously used and revoked
- **THEN** the system invalidates ALL refresh tokens for that user and returns HTTP 401, forcing re-authentication

#### Scenario: Token rotation
- **WHEN** a refresh token is successfully used
- **THEN** the old token is marked `revoked_at = NOW()` and a new token is generated with the same `family_id`

### Requirement: Logout Endpoint
The system SHALL accept a refresh token and mark it as revoked, terminating the user's session. The access token remains valid until its natural expiration (frontend removes it manually).

#### Scenario: Successful logout
- **WHEN** a client submits `POST /api/v1/auth/logout` with a valid refresh token
- **THEN** the system marks the refresh token as revoked and returns HTTP 204 No Content

#### Scenario: Logout with invalid token
- **WHEN** a client submits logout with a non-existent or already-revoked token
- **THEN** the system returns HTTP 401 "Invalid token"

### Requirement: JWT Access Token Structure
The system SHALL issue access tokens with claims containing user ID, email, and roles. The token SHALL be signed with HS256, expire in 30 minutes, and be transmitted in the Authorization header as Bearer token.

#### Scenario: Access token payload
- **WHEN** a user logs in successfully
- **THEN** the access token payload contains `{ sub: user_id, email: user_email, roles: [role_ids], exp: now + 30min }`

#### Scenario: Access token usage in requests
- **WHEN** a client makes a request to a protected endpoint with Authorization header `Authorization: Bearer <token>`
- **THEN** the backend validates the token signature and expiration, and injects the User object into the handler

#### Scenario: Expired access token
- **WHEN** a client uses an access token past its 30-minute expiration
- **THEN** the backend returns HTTP 401 "Token expired", and the frontend's axios interceptor automatically calls refresh

### Requirement: Automatic Role Assignment
The system SHALL assign the CLIENT role automatically to all new registrants. The registration endpoint SHALL NOT accept a role parameter from the client. Only ADMIN users can assign other roles via a separate management endpoint.

#### Scenario: New registrant gets CLIENT role
- **WHEN** a user registers successfully
- **THEN** a UsuarioRol record is created with role_id = CLIENT (not ADMIN, STOCK, or PEDIDOS)

#### Scenario: Client cannot self-assign roles
- **WHEN** a registration request includes a `role` field
- **THEN** the field is ignored and CLIENT is assigned regardless

### Requirement: Protected Routes Dependency
The system SHALL provide a FastAPI dependency `get_current_user` that extracts the access token from the Authorization header, validates its JWT signature and expiration, loads the User object, and injects it into protected endpoints. If the token is missing or invalid, the endpoint returns HTTP 401.

#### Scenario: Protected endpoint with valid token
- **WHEN** a client requests a protected endpoint with a valid JWT in the Authorization header
- **THEN** the endpoint receives the User object and can check roles

#### Scenario: Protected endpoint without token
- **WHEN** a client requests a protected endpoint without an Authorization header
- **THEN** the system returns HTTP 401 "Missing authentication token"

#### Scenario: Protected endpoint with invalid token
- **WHEN** a client requests a protected endpoint with a malformed or expired token
- **THEN** the system returns HTTP 401 "Invalid or expired token"

### Requirement: Role-Based Access Control (RBAC) Foundation
The system SHALL support four roles: ADMIN, STOCK, PEDIDOS, CLIENT. A user can have multiple roles simultaneously via M2M relationship UsuarioRol. The system SHALL provide a `require_role` dependency that checks if the authenticated user has at least one of the required roles and returns HTTP 403 if not.

#### Scenario: Endpoint restricted to ADMIN
- **WHEN** a non-ADMIN user requests an ADMIN-only endpoint
- **THEN** the system returns HTTP 403 Forbidden

#### Scenario: Endpoint allows multiple roles
- **WHEN** a STOCK user requests an endpoint that allows STOCK or ADMIN
- **THEN** the system allows the request

#### Scenario: User with multiple roles
- **WHEN** a user has both STOCK and ADMIN roles
- **THEN** the system grants access to endpoints requiring either role

### Requirement: RefreshToken Database Table
The system SHALL maintain a RefreshToken table with columns: id (PK), token (UUID, unique), user_id (FK to Usuario), expires_at (timestamp), revoked_at (timestamp nullable), family_id (UUID for replay detection). A refresh token is active if revoked_at IS NULL and expires_at > NOW().

#### Scenario: RefreshToken record created on login
- **WHEN** a user logs in successfully
- **THEN** a new RefreshToken record is created with a UUID token, expires_at = NOW() + 7 days, revoked_at = NULL

#### Scenario: RefreshToken revoked on logout
- **WHEN** logout is called
- **THEN** the RefreshToken record is updated with revoked_at = NOW()

#### Scenario: RefreshToken rotated on refresh
- **WHEN** refresh endpoint is called
- **THEN** the old token's revoked_at is set to NOW(), and a new token is created with the same family_id

### Requirement: Email Uniqueness Constraint
The system SHALL enforce that each user email is unique across all active (not deleted) users. The email SHALL be indexed for fast lookup during login and registration validation.

#### Scenario: Email uniqueness enforced at registration
- **WHEN** two users attempt to register with the same email
- **THEN** the second registration fails with HTTP 409 Conflict

#### Scenario: Email lookup during login
- **WHEN** a user logs in
- **THEN** the system performs an indexed lookup on email for performance

### Requirement: Password Hashing with Bcrypt
The system SHALL hash passwords using the bcrypt algorithm with a cost factor ≥ 10. Plaintext passwords SHALL NEVER be stored. When verifying a password, the system SHALL use bcrypt's constant-time comparison to prevent timing attacks.

#### Scenario: Password hashed on registration
- **WHEN** a user registers
- **THEN** the password is hashed with bcrypt (cost ≥ 10) and stored in password_hash; the plaintext password is not stored

#### Scenario: Password verified on login
- **WHEN** a user logs in
- **THEN** the system uses bcrypt's verification function (constant-time comparison) to validate the password against the stored hash

### Requirement: Error Response Format
The system SHALL return errors in a consistent format following RFC 7807 (Problem Details) with fields: `detail` (message), `code` (error code), `status` (HTTP status). All endpoints SHALL use this format for errors.

#### Scenario: Registration error format
- **WHEN** a registration fails (e.g., duplicate email)
- **THEN** the response includes `{ status: 409, code: "DUPLICATE_EMAIL", detail: "El email ya está registrado" }`

#### Scenario: Login error format
- **WHEN** login fails with invalid credentials
- **THEN** the response includes `{ status: 401, code: "INVALID_CREDENTIALS", detail: "Invalid email or password" }`

### Requirement: Frontend authStore (Zustand)
The frontend SHALL implement a Zustand store (authStore) with state: accessToken, refreshToken, user (id, email, roles), isAuthenticated. The store SHALL persist accessToken and refreshToken to localStorage via middleware, and expose selectors: isAuthenticated(), hasRole(role). The store SHALL provide actions: login(), logout(), updateTokens().

#### Scenario: authStore persists tokens
- **WHEN** a user logs in
- **THEN** accessToken and refreshToken are saved to authStore and persisted to localStorage

#### Scenario: authStore survives page refresh
- **WHEN** a page is refreshed
- **THEN** tokens and user data are restored from localStorage

#### Scenario: authStore provides role checks
- **WHEN** a component calls authStore.getState().hasRole("ADMIN")
- **THEN** the store returns true if the user has ADMIN role, false otherwise

### Requirement: Axios Interceptor for JWT
The frontend SHALL configure Axios to automatically attach the access token to every request's Authorization header as `Bearer <token>`. On a 401 response, the interceptor SHALL automatically call the refresh endpoint, update authStore with new tokens, and retry the original request. If refresh fails, the interceptor SHALL log out the user and redirect to login.

#### Scenario: Automatic token attachment
- **WHEN** a request is made to any backend endpoint
- **THEN** the Axios interceptor adds `Authorization: Bearer <accessToken>` to the request headers

#### Scenario: Automatic refresh on 401
- **WHEN** an endpoint returns HTTP 401 (expired access token)
- **THEN** the interceptor calls POST /auth/refresh, updates authStore, and retries the original request transparently

#### Scenario: Redirect to login on refresh failure
- **WHEN** the refresh endpoint returns 401 (refresh token expired or revoked)
- **THEN** the interceptor clears authStore and redirects to the login page
