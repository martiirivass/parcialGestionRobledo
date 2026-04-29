# Spec: auth-dependencies

## Overview
Define las dependencias de FastAPI para autenticación y autorización: get_current_user y require_role.

## ADDED Requirements

### Requirement: get_current_user
El sistema DEBE tener una dependencia que extraiga y valide el usuario del token JWT.

**Scenarios:**

#### Scenario: Token válido retorna usuario
- **GIVEN** un token JWT válido
- **WHEN** se usa get_current_user como dependencia
- **THEN** retorna el objeto Usuario

#### Scenario: Token expirado retorna 401
- **GIVEN** un token JWT expirado
- **WHEN** se usa get_current_user como dependencia
- **THEN** lanza HTTP 401 Unauthorized

#### Scenario: Token inválido retorna 401
- **GIVEN** un token JWT manipulado
- **WHEN** se usa get_current_user como dependencia
- **THEN** lanza HTTP 401 Unauthorized

#### Scenario: Sin token retorna 401
- **GIVEN** request sin header Authorization
- **WHEN** se usa get_current_user como dependencia
- **THEN** lanza HTTP 401 Unauthorized

### Requirement: require_role
El sistema DEBE tener una dependencia factory que verifique roles.

**Scenarios:**

#### Scenario: Usuario con rol permitido pasa
- **GIVEN** usuario con rol ADMIN
- **WHEN** se usa require_role(["ADMIN"])
- **THEN** permite el acceso

#### Scenario: Usuario sin rol permitido retorna 403
- **GIVEN** usuario con rol CLIENT
- **WHEN** se usa require_role(["ADMIN"])
- **THEN** lanza HTTP 403 Forbidden

#### Scenario: Múltiples roles permiten cualquier match
- **GIVEN** usuario con rol PEDIDOS
- **WHEN** se usa require_role(["ADMIN", "PEDIDOS"])
- **THEN** permite el acceso

### Requirement: Rate limiting en login
El endpoint de login DEBE tener rate limiting.

**Scenarios:**

#### Scenario: Rate limit excedido retorna 429
- **GIVEN** más de 5 intentos de login en 15 minutos
- **WHEN** se intenta login nuevamente
- **THEN** retorna HTTP 429 Too Many Requests
## Requirements
### Requirement: get_current_user
El sistema DEBE tener una dependencia que extraiga y valide el usuario del token JWT.

**Scenarios:**

#### Scenario: Token válido retorna usuario
- **GIVEN** un token JWT válido
- **WHEN** se usa get_current_user como dependencia
- **THEN** retorna el objeto Usuario

#### Scenario: Token expirado retorna 401
- **GIVEN** un token JWT expirado
- **WHEN** se usa get_current_user como dependencia
- **THEN** lanza HTTP 401 Unauthorized

#### Scenario: Token inválido retorna 401
- **GIVEN** un token JWT manipulado
- **WHEN** se usa get_current_user como dependencia
- **THEN** lanza HTTP 401 Unauthorized

#### Scenario: Sin token retorna 401
- **GIVEN** request sin header Authorization
- **WHEN** se usa get_current_user como dependencia
- **THEN** lanza HTTP 401 Unauthorized

### Requirement: require_role
El sistema DEBE tener una dependencia factory que verifique roles.

**Scenarios:**

#### Scenario: Usuario con rol permitido pasa
- **GIVEN** usuario con rol ADMIN
- **WHEN** se usa require_role(["ADMIN"])
- **THEN** permite el acceso

#### Scenario: Usuario sin rol permitido retorna 403
- **GIVEN** usuario con rol CLIENT
- **WHEN** se usa require_role(["ADMIN"])
- **THEN** lanza HTTP 403 Forbidden

#### Scenario: Múltiples roles permiten cualquier match
- **GIVEN** usuario con rol PEDIDOS
- **WHEN** se usa require_role(["ADMIN", "PEDIDOS"])
- **THEN** permite el acceso

### Requirement: Rate limiting en login
El endpoint de login DEBE tener rate limiting.

**Scenarios:**

#### Scenario: Rate limit excedido retorna 429
- **GIVEN** más de 5 intentos de login en 15 minutos
- **WHEN** se intenta login nuevamente
- **THEN** retorna HTTP 429 Too Many Requests

