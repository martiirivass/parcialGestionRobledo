## Why

The Food Store e-commerce platform needs a secure logout mechanism to allow users to end their sessions. When users finish shopping or step away from the device, they must be able to invalidate their session to prevent unauthorized access. This feature protects user accounts and is a basic security requirement for any authenticated application.

Currently, the authentication system (US-001) issues JWT access tokens (30 min expiry) and refresh tokens (7 days). The refresh token rotation system (US-003) is now in place. However, there is no explicit logout functionality - users cannot invalidate their refresh tokens, meaning their sessions remain active until tokens naturally expire.

Implementing logout will:
- Allow users to end sessions immediately (invalidate refresh tokens)
- Clear client-side tokens from browser storage (Zustand + localStorage)
- Comply with security best practices for session management

## What Changes

- **New**: Endpoint `POST /api/auth/logout` that accepts refresh token and invalidates it in database
- **Modified**: Frontend authStore - add logout action that clears tokens from store and localStorage
- **Modified**: Existing logout flow to properly invalidate refresh tokens instead of just clearing client state

## Capabilities

### New Capabilities
- `user-logout`: Secure session termination that invalidates refresh token in database and clears client-side tokens

### Modified Capabilities
- `user-authentication`: Extended to include logout endpoint that revokes refresh tokens

## Impact

**Backend**:
- New endpoint: `/api/auth/logout` (POST)
- Modifies existing logout in auth/service.py to properly revoke refresh token from database
- The access token remains valid until natural expiration (stateless - this is expected behavior)

**Frontend**:
- Update authStore.logout() to call API before clearing local state
- Clear localStorage on successful logout

**Database**:
- Uses existing RefreshToken table (US-003) - no new tables needed
- Sets `revocado_en` timestamp on the refresh token (soft delete)

## Dependencies

- US-001: Authentication (JWT) - COMPLETED
- US-003: Refresh Token Rotation - COMPLETED (required for token revocation)

## Security Considerations

- Refresh tokens are invalidated (not deleted) to maintain audit trail
- Access tokens remain valid until expiration - this is standard JWT behavior (stateless)
- Rate limiting on logout endpoint to prevent abuse (future: US-073)