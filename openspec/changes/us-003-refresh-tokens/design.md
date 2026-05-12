## Context

The Food Store authentication system currently supports login/register (US-001) and category browsing (US-002). Access tokens expire in 30 minutes but there is no refresh mechanism, forcing users to re-authenticate or stay logged in indefinitely with stale tokens. The backend uses FastAPI with SQLModel ORM and PostgreSQL. The frontend uses React with Zustand for state management and Axios for HTTP calls. Security requirements mandate no long-lived tokens and detection of replay attacks to prevent compromised refresh tokens from granting indefinite access.

## Goals / Non-Goals

**Goals:**
- Enable seamless session renewal without user re-authentication (automatic via interceptor)
- Implement token rotation: each refresh invalidates the previous token
- Detect replay attacks: if a compromised refresh token is reused, revoke entire family
- Maintain backward compatibility with existing access token format
- Support rate limiting on refresh endpoint to prevent abuse
- Enable cleanup of expired refresh tokens for database hygiene

**Non-Goals:**
- Implement sliding window token expiration (each refresh resets timer completely)
- Support cross-device token sharing or device management
- Implement OAuth2 or OIDC (out of scope, only internal JWT)
- Add support for biometric re-authentication on refresh

## Decisions

### 1. Refresh Token Storage and Format

**Decision**: Opaque UUID v4 tokens stored as bcrypt hashes in database.

**Rationale**:
- Prevents token inspection by clients or attackers who gain read-only DB access
- UUID v4 ensures cryptographic randomness and collision-free generation
- Bcrypt hashing (cost factor 10) protects against dictionary attacks on DB dump

**Alternatives Considered**:
- JWT refresh tokens: Rejected (claims visible to client, harder to revoke)
- Shorter opaque strings: Rejected (lower entropy, higher collision risk)

**Implementation**:
```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    family_id UUID NOT NULL,  -- Groups rotations from same login
    token_hash VARCHAR(255) NOT NULL,  -- bcrypt(token)
    generacion INTEGER NOT NULL DEFAULT 1,  -- Incremented on each rotation
    usado_en TIMESTAMP NULL,  -- When this token was last used for refresh
    revocado_en TIMESTAMP NULL,  -- Soft delete timestamp
    expira_en TIMESTAMP NOT NULL,  -- 7 days from issuance
    creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_family_id (family_id),
    INDEX idx_expira_en (expira_en)
);
```

### 2. Replay Attack Detection via Token Families

**Decision**: Use `familyId` + `generationCounter` to detect reuse. If a token with an old generation is presented, revoke entire family.

**Rationale**:
- Detects both accidental reuse (network duplication) and malicious replay
- Single revocation of all family tokens protects user immediately
- Generation counter prevents false positives from legitimate concurrent requests

**Attack Flow**:
```
1. User logs in → RefreshToken(family=ABC, gen=1) issued
2. User refreshes from Device1 → New token(family=ABC, gen=2), old token marked used
3. Attacker replays old token(family=ABC, gen=1)
4. Server detects gen=1 < current gen=2 for family ABC
5. Server revokes entire family ABC → User must re-authenticate
```

**Alternatives Considered**:
- Whitelist approach (maintain list of valid tokens): Rejected (memory bloat, complex cleanup)
- Single-use tokens with new token pre-generated: Rejected (race conditions on concurrent refresh)
- Timestamp-based detection: Rejected (clock skew, hard to audit)

### 3. Atomic Token Rotation Transaction

**Decision**: All-or-nothing transaction: generate new token AND mark old token as used in single DB transaction.

**Rationale**:
- Prevents state inconsistency (e.g., new token issued but old not marked as used)
- Protects against partial failures mid-rotation
- Uses SQLAlchemy's `async with session` context manager for atomicity

**Implementation**:
```python
async def refresh_token(refresh_token_str: str, uow: UnitOfWork) -> dict:
    async with uow:
        # Validate and fetch old token
        old_token_record = await validate_refresh_token(refresh_token_str, uow)
        
        # Check family for replay attacks
        family_tokens = await uow.refresh_tokens.get_by_family(
            old_token_record.family_id
        )
        if old_token_record.generacion < max(t.generacion for t in family_tokens):
            await uow.refresh_tokens.revoke_family(old_token_record.family_id)
            raise ReplayAttackError("Token reuse detected. All tokens revoked.")
        
        # Generate new tokens
        new_refresh_token = generate_refresh_token()
        new_refresh_record = RefreshToken(
            usuario_id=old_token_record.usuario_id,
            family_id=old_token_record.family_id,
            token_hash=bcrypt_hash(new_refresh_token),
            generacion=old_token_record.generacion + 1,
            expira_en=now() + timedelta(days=7)
        )
        
        # Mark old token as used and create new in single transaction
        await uow.refresh_tokens.mark_used(old_token_record.id, now())
        await uow.refresh_tokens.create(new_refresh_record)
        await uow.commit()  # Atomic
        
        return {
            "accessToken": generate_access_token(old_token_record.usuario_id),
            "refreshToken": new_refresh_token,
            "expiresIn": 1800  # 30 minutes
        }
```

### 4. Frontend Interceptor for Auto-Refresh

**Decision**: Axios response interceptor that detects 401, attempts refresh, updates store, and retries original request.

**Rationale**:
- Transparent to application code (no need to wrap every API call)
- Respects HTTP semantics (401 = Unauthorized, caller doesn't need to know about refresh)
- Zustand store provides single source of truth for tokens

**Implementation**:
```typescript
// frontend/src/shared/api/interceptors.ts
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 && !error.config._retried) {
      try {
        const { refreshToken } = useAuthStore.getState();
        if (!refreshToken) throw new Error("No refresh token available");
        
        const response = await axiosInstance.post("/auth/refresh", {
          refreshToken
        });
        
        useAuthStore.setState({
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken
        });
        
        // Retry original request with new token
        error.config._retried = true;
        return axiosInstance(error.config);
      } catch (refreshError) {
        useAuthStore.setState({ isAuthenticated: false });
        window.location.href = "/login";
      }
    }
    throw error;
  }
);
```

### 5. Rate Limiting on Refresh Endpoint

**Decision**: Max 1 refresh per user per 30 seconds using in-memory sliding window (or Redis if needed later).

**Rationale**:
- Prevents refresh spam from malicious clients or typos
- 30-second window allows legitimate back-to-back refreshes (e.g., tab switching)
- Stateless check using timestamp in refresh token record

**Implementation**:
```python
# Check last refresh timestamp
if old_token_record.usado_en and (now() - old_token_record.usado_en).total_seconds() < 30:
    raise RateLimitError("Refresh rate limited. Try again in 30 seconds.")
```

### 6. Cleanup of Expired Tokens

**Decision**: Async background job runs every hour to soft-delete tokens with `expira_en < now()`.

**Rationale**:
- Prevents unbounded table growth
- No impact on production requests (runs asynchronously)
- Soft delete allows auditing without data loss

**Implementation**:
```python
@scheduler.scheduled_job('interval', hours=1)
async def cleanup_expired_tokens():
    """Delete refresh tokens that have expired."""
    async with get_uow() as uow:
        await uow.refresh_tokens.soft_delete_where(
            RefreshToken.expira_en < datetime.utcnow()
        )
        await uow.commit()
```

## Risks / Trade-offs

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **Race condition on concurrent refresh** | Low | High | Atomic transaction with generation counter increment |
| **Database table unbounded growth** | Medium | Low | Hourly cleanup job removes expired tokens |
| **Token leaked via logs/monitoring** | Medium | High | Token hash stored in DB (not full token); never log token values |
| **Frontend token in localStorage (XSS)** | Medium | High | httpOnly cookie for refresh token (frontend cannot access); separate storage for access token |
| **Clock skew between servers** | Low | Medium | Use database timestamps (UTC) for all expiration checks |
| **User can't refresh if DB is slow** | Low | Medium | Add timeout on refresh endpoint (fail fast after 5s) |

## Migration Plan

### Deployment Steps

1. **Pre-deployment** (no downtime):
   - Deploy new code (backend + frontend) without activating refresh
   - Run migration: `alembic upgrade head` to create `refresh_tokens` table

2. **Activation** (blue-green or canary):
   - Flip feature flag to enable `/auth/refresh` endpoint
   - Monitor error rates and response times
   - Rollback by disabling feature flag if issues

3. **Post-deployment**:
   - Verify interceptor activates on 401 responses
   - Monitor token refresh success rate
   - Start cleanup job for expired tokens

### Rollback Strategy

1. Disable refresh endpoint via feature flag (instant)
2. Revert interceptor in frontend (requires client refresh)
3. Users fall back to re-authentication on token expiration
4. Run `alembic downgrade -1` if full removal needed (migration is reversible)

## Open Questions

1. **Should we invalidate all tokens on password change?** Currently design only revokes on replay. Consider adding password-change event to revoke all families.

2. **Do we need device-specific token binding?** Could track Device-ID header to prevent stolen tokens from working on different devices.

3. **Should mobile apps use different refresh strategy?** Consider native secure storage (Keychain/Keystore) instead of localStorage for refresh token.

4. **What's the SLA for cleanup job?** Current design runs hourly. Could we relax to daily? Need to measure token table growth.
