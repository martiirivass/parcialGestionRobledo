# Spec: auto-refresh-interceptor

## Overview
HTTP client interceptor that transparently detects 401 Unauthorized responses from API endpoints and automatically attempts to refresh the access token before retrying the original request. This enables seamless session renewal without requiring application code changes or explicit retry logic.

## ADDED Requirements

### Requirement: Axios interceptor detects 401 and attempts refresh
The system SHALL implement an Axios response interceptor that detects HTTP 401 responses and automatically attempts token refresh before retrying the original request.

#### Scenario: Successful automatic refresh and retry
- **WHEN** client makes API call with expired access token
- **AND** server returns HTTP 401 Unauthorized
- **THEN** interceptor extracts refreshToken from Zustand authStore
- **AND** interceptor sends `POST /api/auth/refresh` with refreshToken
- **AND** new accessToken is received and stored in authStore
- **AND** original request is retried with new accessToken
- **AND** client receives final successful response (HTTP 200, 201, etc.)

#### Scenario: Original error is transparent to application
- **WHEN** application code calls `apiClient.get('/api/user/profile')`
- **AND** request completes normally after refresh+retry
- **THEN** application receives successful response
- **AND** application does NOT need to handle 401 or refresh logic

### Requirement: Interceptor fails gracefully when refresh is not possible
The system SHALL handle cases where refresh is not possible (no refresh token available, refresh endpoint fails) by logging out the user and redirecting to login page.

#### Scenario: No refresh token available
- **WHEN** client receives 401 response
- **AND** Zustand authStore has no refreshToken (null or empty)
- **THEN** interceptor clears authStore state
- **AND** interceptor redirects user to `/login` page
- **AND** original request is not retried

#### Scenario: Refresh endpoint returns 401 (replay attack detected)
- **WHEN** interceptor sends POST /api/auth/refresh
- **AND** server returns 401 (e.g., replay attack detected)
- **THEN** interceptor clears authStore state (logout)
- **AND** interceptor redirects user to `/login` page
- **AND** error message is displayed: "Session invalid. Please log in again."

#### Scenario: Refresh endpoint returns 429 (rate limited)
- **WHEN** interceptor sends POST /api/auth/refresh
- **AND** server returns 429 Too Many Requests
- **THEN** interceptor waits for `Retry-After` header duration
- **AND** interceptor retries refresh request
- **AND** if retry succeeds, original request is retried
- **AND** if retry fails, user is logged out

### Requirement: Interceptor prevents infinite retry loops
The system SHALL track whether a request has already been retried to prevent infinite loops (e.g., if refresh returns 401 and we re-request with new token that also fails).

**Technical Detail**: Flag `_retried` on request config prevents retry of already-retried requests.

#### Scenario: Only one retry per request
- **WHEN** client receives 401 and interceptor retries once
- **AND** retry also receives 401
- **THEN** second 401 is NOT intercepted again (no infinite loop)
- **AND** second 401 error is propagated to application
- **AND** user is logged out

### Requirement: Zustand authStore is updated with new tokens
The system SHALL update the Zustand authStore with the new access token and refresh token received from the refresh endpoint.

#### Scenario: AuthStore tokens are synchronized
- **WHEN** interceptor receives new tokens from `/api/auth/refresh`
- **THEN** Zustand authStore is updated with `setAuthState({ accessToken: ..., refreshToken: ... })`
- **AND** updated tokens are used for all subsequent requests
- **AND** localStorage is automatically updated (via Zustand persist middleware)

### Requirement: Interceptor preserves original request context
The system SHALL retry the original request with the same method, URL, headers, and body after successful refresh.

#### Scenario: POST request is retried with original body
- **WHEN** client makes `POST /api/orders` with body `{ productIds: [1, 2, 3] }`
- **AND** request fails with 401 due to expired token
- **AND** refresh succeeds
- **THEN** original POST request is retried with EXACT same body `{ productIds: [1, 2, 3] }`
- **AND** no data loss or modification occurs

#### Scenario: Query parameters are preserved on retry
- **WHEN** client makes `GET /api/products?category=fruits&limit=10`
- **AND** request fails with 401
- **AND** refresh succeeds
- **THEN** original request is retried with same query parameters
- **AND** response contains filtered products (not all products)

### Requirement: Concurrent requests handle token refresh safely
The system SHALL handle multiple concurrent API requests that all receive 401 responses by performing refresh only once and using the same new tokens for all retries.

#### Scenario: Multiple concurrent requests refresh once
- **WHEN** two concurrent requests both receive 401 (access token expired)
- **AND** both requests' interceptors are invoked simultaneously
- **THEN** refresh request is sent only ONCE (not twice)
- **AND** both original requests are retried with the SAME new accessToken
- **AND** both requests eventually complete

**Implementation Note**: Use mutex/lock or promise caching to ensure single refresh per token rotation window.

### Requirement: Interceptor configuration supports disabling for specific requests
The system SHALL allow application code to opt-out of auto-refresh for specific requests by adding `skipRefresh: true` to request config.

#### Scenario: Skip auto-refresh for authentication endpoints
- **WHEN** application makes request with config `{ skipRefresh: true }`
- **AND** request receives 401 response
- **THEN** interceptor does NOT attempt refresh
- **AND** 401 error is propagated directly to application

**Rationale**: Prevents refresh loop on `/auth/login` or `/auth/register` endpoints.

### Requirement: Interceptor works across multiple browser tabs
The system SHALL synchronize token refresh across multiple browser tabs, preventing orphaned sessions in one tab while another is refreshing.

#### Scenario: Token refresh in one tab updates all tabs
- **WHEN** user has multiple tabs open for the same app
- **AND** one tab performs a refresh and updates localStorage
- **THEN** other tabs detect the localStorage change event
- **AND** other tabs update their Zustand authStore with new tokens
- **AND** all tabs use the same current accessToken

**Implementation Note**: Listen to `storage` event in browser for localStorage changes.

