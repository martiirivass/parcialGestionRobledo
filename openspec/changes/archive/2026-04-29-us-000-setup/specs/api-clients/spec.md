# Spec: api-clients

## Overview
Define la configuración del cliente Axios con interceptores para autenticación JWT y renovación automática de tokens.

## ADDED Requirements

### Requirement: Axios instancebase configurada
El frontend DEBE tener una instancia de Axios configurada.

**Scenarios:**

#### Scenario: Base URL configurada
- **GIVEN** axios instance
- **WHEN** se hace request
- **THEN** usa VITE_API_BASE_URL como baseURL

### Requirement: Interceptor de request con token
El cliente DEBE adjuntar el access token a cada request.

**Scenarios:**

#### Scenario: Request incluye Authorization header
- **GIVEN** usuario autenticado con access token
- **WHEN** se hace request al backend
- **THEN** incluye header "Authorization: Bearer <token>"

#### Scenario: Sin token no incluye header
- **GIVEN** usuario no autenticado
- **WHEN** se hace request
- **THEN** no incluye header Authorization

### Requirement: Interceptor de response maneja 401
El cliente DEBE manejar automáticamente los 401 intentando refresh.

**Scenarios:**

#### Scenario: 401 intenta refresh
- **GIVEN** respuesta 401 del backend
- **WHEN** se recibe
- **THEN** automáticamente envía refresh token al endpoint

#### Scenario: Refresh exitoso reintenta request
- **GIVEN** refresh exitoso
- **WHEN** se reintenta request original
- **THEN** request original se completa con nuevo token

#### Scenario: Refresh fallido hace logout
- **GIVEN** refresh token inválido o expirado
- **WHEN** se intenta refresh
- **THEN** limpia tokens y redirige a login