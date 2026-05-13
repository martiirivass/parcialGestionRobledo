# User Logout Specification

## Overview

Capability to allow authenticated users to securely end their sessions by invalidating refresh tokens.

## Functional Requirements

### FR-001: Logout Endpoint
- **Description**: POST /api/v1/auth/logout
- **Input**: { refresh_token: string }
- **Output**: { message: string } on success
- **Behavior**:
  - Validates refresh token exists
  - Hashes token and looks up in database
  - Sets revocado_en timestamp (soft delete)
  - Returns success message

### FR-002: Client-Side Cleanup
- **Description**: Clear tokens from browser storage
- **Behavior**:
  - Calls logout API first
  - Clears Zustand auth store state
  - Removes tokens from localStorage (via persist middleware)

## Data Model

### RefreshToken (existing from US-003)
- Field: `revocado_en` (TIMESTAMP NULL) - set on logout
- No schema changes needed

## API Contract

### POST /api/v1/auth/logout

**Request**:
```json
{
  "refresh_token": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200)**:
```json
{
  "message": "Logged out successfully"
}
```

**Errors**:
- 400: Invalid request format
- 401: No token provided or token not found
- 500: Server error

## Security Considerations

- Refresh token is revoked (not deleted) - preserves audit trail
- Access token remains valid until natural expiration (JWT stateless behavior)
- Short access token expiry (30 min) limits post-logout exposure