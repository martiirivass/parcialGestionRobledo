## Context

The Food Store authentication system has:
- US-001: Login/Register with JWT access tokens and basic refresh tokens
- US-003: Refresh token rotation with family-based replay detection and token hashing

Users need a way to explicitly end their sessions. This change implements the logout functionality.

## Goals / Non-Goals

**Goals:**
- Allow users to logout and invalidate their refresh tokens
- Clear client-side tokens from browser storage
- Follow security best practices

**Non-Goals:**
- Implement "logout from all devices" feature (future)
- Implement token blacklisting for access tokens (not needed - JWT stateless by design)
- Implement session management UI (future)

## Decisions

### 1. Soft Delete vs Hard Delete for Refresh Tokens

**Decision**: Use soft delete (set `revocado_en` timestamp) instead of hard delete.

**Rationale**:
- Maintains audit trail for security analysis
- Can track when user logged out
- Consistent with soft delete pattern used elsewhere (products, categories)

**Implementation**:
```python
# backend/app/auth/service.py
def logout_user(self, refresh_token_str: str) -> bool:
    token = self.token_repo.find_by_token_hash(hash_token(refresh_token_str))
    if not token:
        return False
    
    token.revocado_en = datetime.utcnow()
    self.session.flush()
    return True
```

### 2. Frontend Logout Flow

**Decision**: Call logout API first, then clear local state.

**Rationale**:
- Ensures token is invalidated server-side even if client cleanup fails
- Better UX - can show error if revocation fails

**Implementation**:
```typescript
// frontend/src/features/auth/store/authStore.ts
logout: async () => {
  const refreshToken = get().refreshToken;
  
  if (refreshToken) {
    try {
      await authApi.logout(refreshToken);
    } catch (e) {
      // Ignore errors - clear local anyway
    }
  }
  
  set({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
  });
}
```

### 3. Access Token Behavior Post-Logout

**Decision**: Access token remains valid until natural expiration.

**Rationale**:
- JWT is stateless - server cannot invalidate access tokens
- This is expected JWT behavior per security best practices
- Short expiry (30 min) limits exposure window
- Refresh token revocation prevents new tokens from being issued

## API Design

### POST /api/v1/auth/logout

**Request Body**:
```json
{
  "refresh_token": "uuid-string"
}
```

**Response (200)**:
```json
{
  "message": "Logged out successfully"
}
```

**Error Responses**:
- 400: Invalid request format
- 401: No token provided
- 500: Server error

## Data Model

Uses existing `RefreshToken` table from US-003:
- `revocado_en` set to current timestamp (soft delete)
- Other fields unchanged

## Acceptance Criteria

1. **GIVEN** an authenticated user, **WHEN** calls logout endpoint with refresh token, **THEN** the refresh token is marked as revoked in database
2. **GIVEN** an access token used after logout, **WHEN** making a request, **THEN** the token remains valid until its natural 30-minute expiration
3. **GIVEN** a user logs out, **THEN** the frontend clears tokens from Zustand store and localStorage

## Testing Plan

1. Backend tests:
   - Test logout with valid refresh token returns 200
   - Test logout with invalid token returns 401
   - Test token is marked as revoked in DB

2. Frontend tests:
   - Test logout clears store state
   - Test logout removes localStorage entry
   - Test logout calls API before clearing

## Files to Modify

- `backend/app/auth/service.py` - Update logout_user method
- `backend/app/auth/router.py` - Ensure logout endpoint uses token hash
- `frontend/src/features/auth/store/authStore.ts` - Add API call in logout
- `frontend/src/features/auth/api.ts` - Add logout API function

## Files to Create

- None - uses existing infrastructure