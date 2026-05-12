# Spec: token-refresh

## Overview
Secure token rotation endpoint that accepts a valid refresh token and returns a new access + refresh token pair. The system MUST detect and prevent replay attacks by tracking token families and generations. Each refresh rotates tokens: the new refresh token invalidates the previous one.

## ADDED Requirements

### Requirement: Refresh endpoint accepts refresh token and returns new token pair
The system SHALL provide a `POST /api/auth/refresh` endpoint that accepts a refresh token and returns a new access token + refresh token pair with updated expiration times.

**Prerequisites**:
- Request body MUST contain `refreshToken` field (string)
- Response MUST include `accessToken` (JWT string, 30-min expiration), `refreshToken` (opaque UUID), `expiresIn` (integer, seconds)

#### Scenario: Valid refresh token returns new token pair
- **WHEN** client sends `POST /api/auth/refresh` with a valid, non-expired refresh token
- **THEN** system returns HTTP 200 with new `accessToken`, `refreshToken`, and `expiresIn` fields
- **AND** new refresh token has expiration 7 days from issue
- **AND** previous refresh token is marked as used

#### Scenario: Expired refresh token returns 401
- **WHEN** client sends `POST /api/auth/refresh` with an expired refresh token (expiry < now)
- **THEN** system returns HTTP 401 Unauthorized with message "Token expired"
- **AND** previous token is NOT marked as used

#### Scenario: Invalid refresh token returns 401
- **WHEN** client sends `POST /api/auth/refresh` with a token that does not exist in database
- **THEN** system returns HTTP 401 Unauthorized with message "Invalid token"
- **AND** no new tokens are issued

### Requirement: Token rotation invalidates previous refresh token
The system SHALL automatically invalidate the previous refresh token when a new one is issued. The token rotation MUST be atomic: if any operation fails, neither token is modified.

#### Scenario: Previous token is marked as used after rotation
- **WHEN** client successfully refreshes (receives new token)
- **THEN** the previous refresh token record shows `usado_en = <current-timestamp>`
- **AND** attempting to use the old token again returns 401

#### Scenario: New token cannot be issued if transaction fails
- **WHEN** database transaction fails during token rotation (e.g., connection lost)
- **THEN** no tokens are created or modified
- **AND** client receives HTTP 500 and can retry with original token

### Requirement: Replay attack detection via token family tracking
The system SHALL detect replay attacks by maintaining a generation counter within token families. If a token with a lower generation is presented, all tokens in that family MUST be revoked and user must re-authenticate.

**Technical Details**:
- Each login creates a new `familyId` (UUID)
- Each refresh increments `generationCounter`
- Before issuing new token, system checks: if received token's generation < latest generation in family, it's a replay

#### Scenario: Replay of old token revokes entire family
- **WHEN** client sends refresh request with a token that has generation N and latest generation in family is N+1
- **THEN** system revokes entire family (all tokens in same familyId)
- **AND** system returns HTTP 401 with message "Replay attack detected. Please re-authenticate."
- **AND** all subsequent refresh attempts with any token from that family return 401

#### Scenario: Concurrent refresh with same token doesn't trigger false positive
- **WHEN** two tabs send refresh request simultaneously with same token (network race)
- **THEN** first request succeeds with new generation N+1
- **AND** second request detects generation == current generation (not replay)
- **AND** second request returns HTTP 409 Conflict with message "Token already rotated"

### Requirement: Rate limiting on refresh endpoint
The system SHALL limit refresh token requests to prevent abuse. Maximum 1 refresh per user per 30 seconds.

#### Scenario: Refresh request within rate limit succeeds
- **WHEN** client sends refresh request more than 30 seconds after last successful refresh
- **THEN** system processes request normally and returns new tokens

#### Scenario: Refresh request exceeds rate limit returns 429
- **WHEN** client sends refresh request less than 30 seconds after last successful refresh
- **THEN** system returns HTTP 429 Too Many Requests
- **AND** response includes `Retry-After: <seconds>` header indicating when next refresh is allowed

### Requirement: New refresh token always has 7-day expiration
The system SHALL issue refresh tokens with exactly 7-day expiration from time of issue, regardless of when they are used.

#### Scenario: Refresh token expiration is always 7 days from issue
- **WHEN** system issues a new refresh token at timestamp T
- **THEN** token's `expiresAt` field equals T + 7 days
- **AND** even if token is used multiple times (rotations), each new token gets fresh 7-day expiration

### Requirement: Refresh token request does not require Authorization header
The system SHALL allow refresh requests without requiring a valid access token (no Authorization header needed).

**Rationale**: Refresh tokens are used when access tokens expire, so Authorization header validation cannot be enforced.

#### Scenario: Refresh endpoint works without access token
- **WHEN** client sends `POST /api/auth/refresh` without `Authorization` header
- **THEN** system validates refresh token parameter and processes normally
- **AND** no 401 error is raised for missing Authorization header

### Requirement: Error responses include standardized format
The system SHALL return all errors in consistent JSON format with `statusCode`, `message`, `error` fields.

#### Scenario: Refresh token error response format
- **WHEN** refresh request fails (e.g., invalid token, rate limited, etc)
- **THEN** response contains `{ statusCode: <code>, message: "<description>", error: "<error-type>" }`
- **AND** no sensitive information is exposed (e.g., usernames, existence of tokens in DB)

## MODIFIED Requirements

### Requirement: User authentication records track token families
The system MUST associate each user with their current token family for replay detection. When a token is used, its familyId MUST be recorded.

#### Scenario: Token family is consistent across rotations
- **WHEN** user logs in and receives initial refresh token with familyId ABC
- **AND** user refreshes multiple times
- **THEN** all tokens from that login session share the same familyId ABC
- **AND** when user logs in again from different session, new familyId is assigned

