## 1. Database Schema and Migration

- [ ] 1.1 Create Alembic migration file: `migrations/versions/add_refresh_tokens_table.py`
- [ ] 1.2 Define `refresh_tokens` table with columns: `id` (UUID PK), `usuario_id` (FK), `family_id` (UUID), `token_hash` (VARCHAR), `generacion` (INT), `usado_en` (TIMESTAMP NULL), `revocado_en` (TIMESTAMP NULL), `expira_en` (TIMESTAMP), `creado_en` (TIMESTAMP)
- [ ] 1.3 Add indexes: `idx_usuario_id`, `idx_family_id`, `idx_expira_en`
- [ ] 1.4 Add FOREIGN KEY constraint: `usuario_id` REFERENCES `usuarios(id)` ON DELETE CASCADE
- [ ] 1.5 Test migration is reversible: `alembic downgrade -1` succeeds without errors
- [ ] 1.6 Apply migration to development database: `alembic upgrade head`

## 2. Backend Data Model

- [ ] 2.1 Create SQLModel `RefreshToken` class in `backend/app/models/ventas.py` (or new file)
  - Fields: `id` (UUID, PK), `usuario_id` (INT, FK), `family_id` (UUID), `token_hash` (str), `generacion` (int), `usado_en` (datetime nullable), `revocado_en` (datetime nullable), `expira_en` (datetime), `creado_en` (datetime)
  - Use `datetime.utcnow` as default factory for timestamps
- [ ] 2.2 Create Relationship from `RefreshToken` to `Usuario` (back_populates)
- [ ] 2.3 Add RefreshToken to `backend/app/models/__init__.py` exports

## 3. Backend Repository and Service Layer

- [ ] 3.1 Create `RefreshTokenRepository` in `backend/app/repositories/refresh_token_repository.py`
  - Inherit from `BaseRepository[RefreshToken]`
  - Implement `get_by_token_hash(token_hash)` → RefreshToken or None
  - Implement `get_latest_by_family(usuario_id, family_id)` → RefreshToken
  - Implement `get_all_by_family(family_id)` → List[RefreshToken]
  - Implement `revoke_family(family_id)` → marks all in family as revoked
  - Implement `mark_used(token_id, timestamp)` → sets `usado_en`
- [ ] 3.2 Add `RefreshTokenRepository` to `UnitOfWork` class as `self.refresh_tokens`
- [ ] 3.3 Create `refresh_token_service.py` in `backend/app/auth/`
  - Implement `generate_refresh_token_record(usuario_id, family_id=None) -> RefreshToken`
    - If no family_id provided, create new UUID
    - Generate new UUID token, hash with bcrypt
    - Set expiration to now + 7 days, generation to 1
  - Implement `validate_and_rotate_refresh_token(token_str, uow) -> dict`
    - Hash incoming token and lookup in DB
    - Check if expired: `expira_en < now` → raise 401
    - Check if revoked: `revocado_en is not None` → raise 401
    - Check for replay: compare token generation to latest in family
    - If generation < latest: call revoke_family() → raise 401 ReplayAttackError
    - Check rate limit: if `usado_en` and `now - usado_en < 30s` → raise 429 RateLimitError
    - Generate new token and new RefreshToken record (generation += 1, same family_id)
    - Mark old token as used in atomic transaction
    - Return dict with new accessToken, refreshToken, expiresIn
  - Implement `revoke_all_tokens_for_user(usuario_id, uow)` (for logout)
    - Revoke all refresh tokens for user (set `revocado_en`)
- [ ] 3.4 Add comprehensive type hints and docstrings to all functions

## 4. Backend Authentication Utilities

- [ ] 4.1 Update `backend/app/core/security.py`
  - Add `hash_token(token: str) -> str` using bcrypt
  - Add `verify_token_hash(token: str, hash: str) -> bool` using bcrypt.verify
- [ ] 4.2 Update `backend/app/auth/service.py` (existing auth service)
  - Modify `authenticate_user()` to include `familyId` generation on successful login
  - Modify login response to include initial refresh token

## 5. Backend API Endpoints

- [ ] 5.1 Create Pydantic schemas in `backend/app/auth/schemas.py`
  - `RefreshTokenRequest` with `refreshToken` (str)
  - `TokenResponse` with `accessToken` (str), `refreshToken` (str), `expiresIn` (int), `tokenType` (str, default "Bearer")
  - `RefreshResponse` with same as TokenResponse
- [ ] 5.2 Create `POST /api/v1/auth/refresh` endpoint in `backend/app/auth/router.py`
  - Accept RefreshTokenRequest
  - Call `refresh_token_service.validate_and_rotate_refresh_token()`
  - Return 200 TokenResponse on success
  - Return 401 on invalid/expired/replay token with appropriate message
  - Return 429 on rate limit with `Retry-After` header
  - Return 500 on database errors
- [ ] 5.3 Register updated auth router in `backend/app/main.py`
- [ ] 5.4 Verify endpoint appears in Swagger docs at `/docs`

## 6. Backend Integration Tests

- [ ] 6.1 Create `backend/app/tests/test_refresh_token_service.py`
  - Test `generate_refresh_token_record()` creates valid record
  - Test `validate_and_rotate_refresh_token()` with valid token returns new token pair
  - Test expired token returns 401
  - Test invalid token returns 401
  - Test replay attack detection (old generation) revokes family
  - Test rate limit prevents refresh within 30 seconds
  - Test new token has 7-day expiration
  - Test atomic transaction (no partial updates)
- [ ] 6.2 Create `backend/app/tests/test_refresh_token_router.py`
  - Test `POST /api/auth/refresh` with valid token returns 200
  - Test with expired token returns 401
  - Test with invalid token returns 401
  - Test with replay token returns 401
  - Test rate limit returns 429 with Retry-After header
  - Test request without Authorization header succeeds (refresh doesn't require it)
  - Test response format matches TokenResponse schema
- [ ] 6.3 Run all tests: `cd backend && pytest app/tests/test_refresh_token_* -v`
- [ ] 6.4 Verify test coverage >= 80%

## 7. Backend Cleanup Job

- [ ] 7.1 Add APScheduler dependency to `backend/requirements.txt`
- [ ] 7.2 Create scheduled task in `backend/app/db/scheduler.py`
  - Define `cleanup_expired_tokens()` async function
  - Query refresh_tokens where `expira_en < now()`
  - Soft delete (set `revocado_en = now()`)
  - Schedule to run every hour using APScheduler
- [ ] 7.3 Initialize scheduler in `backend/app/main.py` on app startup

## 8. Frontend Axios Configuration

- [ ] 8.1 Verify Axios client exists at `frontend/src/shared/api/client.ts`
- [ ] 8.2 Create `frontend/src/shared/api/refreshInterceptor.ts`
  - Implement response interceptor that detects 401
  - Extract refreshToken from authStore (use `getState()` outside React)
  - Send POST request to `/api/auth/refresh` with refreshToken
  - On success: call `updateTokens()` in authStore
  - Retry original request with new token
  - On failure: logout user, clear store, redirect to `/login`
  - Handle rate limit (429) by waiting and retrying
  - Prevent infinite loops with `_retried` flag
  - Handle concurrent requests (only refresh once, use same tokens for all)
- [ ] 8.3 Attach interceptor in client setup: `axiosInstance.interceptors.response.use(...)`
- [ ] 8.4 Implement skipRefresh option to opt-out of auto-refresh for certain endpoints

## 9. Frontend Auth Store Updates

- [ ] 9.1 Update `frontend/src/features/auth/store/authStore.ts` (Zustand)
  - Add `refreshToken` state field (string nullable)
  - Add `updateTokens(accessToken, refreshToken)` action
  - Ensure refreshToken is persisted in localStorage via middleware
- [ ] 9.2 Update `logout()` action to clear both tokens
- [ ] 9.3 Update initial state from localStorage to restore tokens if present

## 10. Frontend Cross-Tab Synchronization

- [ ] 10.1 Create `frontend/src/shared/storage/storageListener.ts`
  - Listen to `storage` event in browser (triggered when other tab modifies localStorage)
  - On localStorage change: check if `food-store-auth` was updated
  - If updated: reload authStore from localStorage
  - Re-attach interceptor if tokens changed
- [ ] 10.2 Initialize storage listener in `frontend/src/app/App.tsx` on mount
- [ ] 10.3 Test: make API call in Tab A, verify Tab B detects token refresh

## 11. Frontend Integration and Error Handling

- [ ] 11.1 Update `frontend/src/features/auth/api.ts`
  - Add `refreshTokenAPI()` that calls POST `/api/auth/refresh`
  - Handle various error cases (401, 429, 5xx)
  - Return error messages for display
- [ ] 11.2 Create error handling utilities in `frontend/src/shared/api/errorHandler.ts`
  - Translate 401 error to "Session expired"
  - Translate 429 error to "Too many requests, please wait..."
  - Format error messages for display in UI
- [ ] 11.3 Update `frontend/src/shared/components/ErrorBoundary.tsx` to handle refresh errors

## 12. Frontend Tests

- [ ] 12.1 Create `frontend/tests/authStore.test.ts`
  - Test `updateTokens()` updates state and localStorage
  - Test `logout()` clears both tokens
  - Test initial state loads from localStorage
- [ ] 12.2 Create `frontend/tests/refreshInterceptor.test.ts`
  - Mock Axios and authStore
  - Test interceptor detects 401 and calls refresh
  - Test successful refresh retries original request
  - Test failed refresh logs out user
  - Test rate limit (429) waits before retrying
  - Test `_retried` flag prevents infinite loops
  - Test concurrent requests refresh only once
- [ ] 12.3 Create `frontend/tests/storageListener.test.ts`
  - Test storage event listener detects localStorage changes
  - Test authStore is updated from another tab
- [ ] 12.4 Run all tests: `cd frontend && npm test`
- [ ] 12.5 Verify test coverage >= 70%

## 13. Code Quality and Linting

- [ ] 13.1 Run backend linting: `cd backend && pylint app/auth/ app/models/ app/repositories/` 
- [ ] 13.2 Run backend type checking: `cd backend && mypy app/auth/ app/models/ app/repositories/`
- [ ] 13.3 Run frontend linting: `cd frontend && npm run lint`
- [ ] 13.4 Run frontend type checking: `cd frontend && npm run build`
- [ ] 13.5 Format backend code: `cd backend && black app/auth/ app/models/`
- [ ] 13.6 Format frontend code: `cd frontend && npm run format`

## 14. Manual Testing and Validation

- [ ] 14.1 Start backend: `cd backend && uvicorn app.main:app --reload`
- [ ] 14.2 Start frontend: `cd frontend && npm run dev`
- [ ] 14.3 Test refresh flow manually:
  - Open app, log in successfully
  - Verify access token and refresh token in localStorage
  - Make an API call (should succeed with new token)
  - Wait 30 min (or mock time) until access token would expire
  - Make another API call
  - Interceptor should detect 401, refresh, and retry (user doesn't see error)
- [ ] 14.4 Test replay attack:
  - Capture a refresh token from Network tab
  - Attempt to reuse it twice
  - Verify second use returns 401 "Replay attack detected"
  - Verify entire family is revoked (all tokens invalid)
- [ ] 14.5 Test rate limit:
  - Trigger two refresh requests within 30 seconds
  - Verify second returns 429 with Retry-After header
- [ ] 14.6 Test logout:
  - Log in successfully
  - Click logout button
  - Verify tokens cleared from localStorage
  - Try to access protected route
  - Verify redirected to `/login`
- [ ] 14.7 Test multi-tab sync:
  - Open app in two tabs
  - Log in in Tab A
  - Verify Tab B detects new tokens (if running on same domain)

## 15. Documentation

- [ ] 15.1 Update API documentation at `backend/app/auth/README.md`
  - Document `/api/auth/refresh` endpoint
  - Include request/response examples
  - Explain error codes
- [ ] 15.2 Add docstrings to all public functions (backend + frontend)
  - Describe parameters, return types, exceptions
- [ ] 15.3 Update AGENTS.md if authentication patterns changed
- [ ] 15.4 Add inline comments explaining replay attack detection logic

## 16. Git and Version Control

- [ ] 16.1 Create branch: `git checkout -b change/us-003-refresh-tokens`
- [ ] 16.2 Commit database migration: `git commit -m "feat(db): add refresh_tokens table with family-based tracking"`
- [ ] 16.3 Commit backend model/repo: `git commit -m "feat(backend): implement RefreshToken model and RefreshTokenRepository"`
- [ ] 16.4 Commit backend service: `git commit -m "feat(backend): implement token rotation with replay attack detection"`
- [ ] 16.5 Commit backend endpoints: `git commit -m "feat(backend): add POST /api/auth/refresh endpoint with rate limiting"`
- [ ] 16.6 Commit backend tests: `git commit -m "test(backend): add comprehensive tests for refresh token flow"`
- [ ] 16.7 Commit cleanup job: `git commit -m "feat(backend): add scheduled cleanup of expired refresh tokens"`
- [ ] 16.8 Commit frontend interceptor: `git commit -m "feat(frontend): implement auto-refresh Axios interceptor"`
- [ ] 16.9 Commit frontend auth store: `git commit -m "feat(frontend): update authStore with token refresh support"`
- [ ] 16.10 Commit frontend tests: `git commit -m "test(frontend): add tests for refresh interceptor and auth store"`
- [ ] 16.11 Push branch: `git push origin change/us-003-refresh-tokens`

## 17. Integration and Cross-System Testing

- [ ] 17.1 Test with multiple concurrent users logging in and refreshing simultaneously
- [ ] 17.2 Test token expiration behavior matches spec (30 min access, 7 day refresh)
- [ ] 17.3 Verify database query performance with large number of historical tokens
- [ ] 17.4 Test cleanup job removes old tokens without affecting active sessions
- [ ] 17.5 Verify no sensitive data in logs (tokens, hashes)

## 18. Performance and Security Review

- [ ] 18.1 Run backend security scan: `bandit app/auth/ app/models/`
- [ ] 18.2 Verify tokens are never logged or exposed in error messages
- [ ] 18.3 Confirm all password/token hashing uses bcrypt (not plain text)
- [ ] 18.4 Review rate limiting threshold (1 per 30s reasonable? adjust if needed)
- [ ] 18.5 Test performance of refresh endpoint under load (target: <100ms for valid token)

## 19. Final Verification and Merge

- [ ] 19.1 All tests pass: `cd backend && pytest app/tests/test_refresh_token_* -v && cd ../frontend && npm test`
- [ ] 19.2 No TypeScript errors: `cd frontend && npm run build`
- [ ] 19.3 No Python type errors: `cd backend && mypy app/auth/ app/models/ app/repositories/`
- [ ] 19.4 Create pull request with summary from proposal.md
- [ ] 19.5 PR approved by code reviewer
- [ ] 19.6 PR merged to main branch
- [ ] 19.7 Delete feature branch: `git branch -d change/us-003-refresh-tokens`

## 20. Archive and Cleanup

- [ ] 20.1 Archive the change: `openspec archive us-003-refresh-tokens`
  - Specs synced to `openspec/specs/token-refresh/` and `openspec/specs/auto-refresh-interceptor/`
  - Change moved to `openspec/changes/archive/`
- [ ] 20.2 Verify archive completed successfully
- [ ] 20.3 Update main README.md with new feature documentation if needed
- [ ] 20.4 Commit archive changes: `git commit -m "docs(archive): archive us-003-refresh-tokens after merge"`

