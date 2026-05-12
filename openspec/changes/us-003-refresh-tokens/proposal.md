## Why

The Food Store e-commerce platform requires secure token rotation to maintain user sessions safely over time. Currently, access tokens last 30 minutes without a mechanism to refresh them, forcing users to re-authenticate frequently or remain logged in indefinitely with stale tokens. Implementing refresh token rotation (with replay attack detection) enables seamless session management, reduces friction for users, and prevents the security vulnerabilities of long-lived access tokens. This capability is essential for US-004 (Logout), US-005 (RBAC management), and all authenticated features.

## What Changes

- **New**: Endpoint `POST /api/auth/refresh` that accepts a refresh token and returns a new access + refresh token pair
- **New**: Refresh token rotation mechanism: each refresh invalidates the previous token and issues a new one
- **New**: Replay attack detection: if a refresh token is reused (used twice), all tokens in its family are revoked and user must re-authenticate
- **New**: Database table `refresh_tokens` storing token metadata (familyId, generationCounter, used flag, expiration)
- **New**: Axios interceptor on frontend to detect 401 responses and automatically attempt refresh before re-trying the request
- **New**: `updateTokens()` action in authStore to synchronize new tokens after refresh
- **Modified**: `RefreshToken` model in backend to support token rotation tracking
- **Modified**: Authentication middleware to support token family tracking for replay detection

## Capabilities

### New Capabilities
- `token-refresh`: Secure token rotation endpoint that accepts a valid refresh token and returns a new access + refresh token pair, with automatic invalidation of the previous refresh token and detection of replay attacks via token family tracking
- `auto-refresh-interceptor`: HTTP client interceptor that transparently retries failed requests with a refreshed token when a 401 Unauthorized response is received

### Modified Capabilities
- `user-authentication`: Extend JWT token lifecycle management to support refresh token rotation and family-based replay detection (new fields: `familyId`, `generationCounter`, `used` in refresh tokens table)

## Impact

**Backend**:
- New model: `RefreshToken` with fields for familyId, generation counter, and revocation tracking
- New database migration: `refresh_tokens` table with indexes on `userId` and `familyId`
- New service function: `refresh_token()` with transaction logic for atomic rotation
- New endpoint: `/api/auth/refresh` (stateless, no authentication header required but validates refresh token)
- New repository: `RefreshTokenRepository` with queries for family-based token invalidation

**Frontend**:
- New Axios interceptor that detects 401 → attempts refresh → retries original request
- Updated authStore: `updateTokens()` action, `refreshToken` state field
- Token synchronization across browser tabs via localStorage events

**Database**:
- New table: `refresh_tokens` (userId FK, familyId, generationCounter, tokenHash, used, revokedAt, expiresAt, createdAt)
- Constraint: UNIQUE on (userId, familyId, generationCounter) to detect concurrent rotations
- Index on `expiresAt` for cleanup queries

**Breaking Changes**:
- None. Access token format unchanged. Refresh tokens previously stored are not compatible with new family-based system (cleanup needed on deployment).

**Security Considerations**:
- Tokens are opaque UUIDs (not JWT) to prevent client-side inspection
- Token hash stored in DB (bcrypt) to prevent token leakage from DB dumps
- Automatic revocation of entire family on replay detection
- Rate limiting on refresh endpoint (max 1 refresh per 30 seconds per user) to prevent abuse
