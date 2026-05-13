## Phase 1: Backend Implementation

- [ ] 1.1 Update `backend/app/auth/service.py` - logout_user method
  - Hash incoming refresh token
  - Find token in database by hash
  - Set revocado_en timestamp (soft delete)
  - Return True on success, False if token not found
  - Add docstring with parameters and return type

- [ ] 1.2 Verify `backend/app/auth/router.py` logout endpoint exists
  - Check POST /auth/logout endpoint
  - Ensure it passes refresh_token to service

- [ ] 1.3 Run backend tests
  - Test logout with valid token
  - Test logout with invalid token
  - Verify revocado_en is set in database

## Phase 2: Frontend Implementation

- [ ] 2.1 Update `frontend/src/features/auth/api.ts`
  - Add logoutAPI(refreshToken) function
  - POST to /api/v1/auth/logout with { refresh_token }
  - Return success/error

- [ ] 2.2 Update `frontend/src/features/auth/store/authStore.ts`
  - Modify logout() action to:
    - Get refreshToken from state
    - Call logoutAPI() before clearing state
    - Handle errors gracefully (still clear local state)
    - Clear all auth state (user, accessToken, refreshToken)

- [ ] 2.3 Verify localStorage is cleared
  - Zustand persist middleware handles this automatically
  - Verify storage key is removed on logout

## Phase 3: Testing

- [ ] 3.1 Backend integration test
  - POST /auth/logout with valid refresh token → 200
  - POST /auth/logout with invalid token → 401

- [ ] 3.2 Frontend manual test
  - Login and verify tokens stored
  - Click logout button
  - Verify tokens cleared from store and localStorage

## Phase 4: Verification

- [ ] 4.1 Verify refresh token is revoked in database after logout
- [ ] 4.2 Verify access token still works until expiration (stateless behavior)
- [ ] 4.3 Verify cannot refresh after logout (refresh token revoked)

## Notes

**Dependencies**:
- US-003: Refresh token rotation must be complete (we just completed it)

**Implementation Notes**:
- Using token hash for lookup (not plaintext token) - consistent with US-003
- Soft delete preserves audit trail
- Frontend calls API first, then clears local state