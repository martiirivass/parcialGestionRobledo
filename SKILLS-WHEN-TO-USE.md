# 🎯 CUÁNDO USAR CADA SKILL - Food Store

Guía de referencia rápida para elegir qué skill usar en cada situación.

---

## 🔐 AUTENTICACIÓN & SEGURIDAD

### Necesitas: Autenticación JWT con RBAC
**Skills**: `api-authentication`, `jwt-authentication`, `secure-auth`

```bash
# Scenario US-001: Implementar login
/opsx:apply us-001-auth
"Usa api-authentication para diseñar el endpoint,
 jwt-authentication para tokens,
 secure-auth para bcrypt passwords"
```

**Qué hace cada una**:
- `api-authentication`: Flujo de autenticación, endpoints
- `jwt-authentication`: Tokens, refresh tokens, validation
- `secure-auth`: Password hashing, seguridad

---

### Necesitas: Refresh tokens & Token rotation
**Skill**: `jwt-authentication`

```
"Implementa refresh tokens con jwt-authentication"
```

---

### Necesitas: Password seguro (bcrypt)
**Skill**: `secure-auth`

```
"Hashea el password con bcrypt usando secure-auth"
```

---

## 🛢️ BASE DE DATOS

### Necesitas: Diseñar modelo de datos
**Skills**: `database-expert`, `database`

```bash
# Scenario US-002: Categorías jerárquicas
/opsx:explore us-002-categorias
"Usa database-expert para pensar en relaciones y constraints"
```

**Qué hace cada una**:
- `database-expert`: Relaciones, normalización, indexes, optimización
- `database`: Patterns, migrations, schema design

---

### Necesitas: Migraciones Alembic
**Skill**: `database` o `database-expert`

```
"Crea una migración Alembic para la tabla de categorías
 usando database-expert"
```

---

### Necesitas: Optimizar queries
**Skill**: `database-expert`

```
"Optimiza esta query con indexes y joins correctos (database-expert)"
```

---

### Necesitas: Relaciones complejas
**Skills**: `database-expert` + `api-design-principles`

```
"Diseña cómo User ↔ Orders ↔ Products se relacionan
 (database-expert + api-design-principles)"
```

---

## 🌐 API REST

### Necesitas: Diseñar endpoints RESTful
**Skill**: `api-design-principles`

```bash
# Scenario US-003: CRUD de Productos
/opsx:propose us-003-productos
"Diseña endpoints REST para productos con api-design-principles"
```

**Responde**: ✓ GET /api/v1/products, POST, PUT, DELETE

---

### Necesitas: Validación de requests
**Skills**: `api-design-principles` + `fastapi`

```
"Valida request body con Pydantic (fastapi)
 siguiendo api-design-principles"
```

---

### Necesitas: Respuestas consistentes
**Skill**: `api-design-principles`

```
"Estructura las respuestas JSON consistentemente (api-design-principles)"
```

---

### Necesitas: Paginación, filtering, sorting
**Skills**: `api-design-principles` + `fastapi`

```
"Implementa paginación con limit/offset
 (api-design-principles + fastapi)"
```

---

## ⚙️ IMPLEMENTACIÓN FASTAPI

### Necesitas: Crear endpoint simple
**Skill**: `fastapi`

```bash
# Scenario US-002: GET /api/v1/categories
/opsx:apply us-002-categorias
"Implementa GET /categories con fastapi"
```

---

### Necesitas: Dependency injection
**Skill**: `fastapi`

```
"Usa FastAPI dependencies para inyectar db session (fastapi)"
```

---

### Necesitas: Middleware
**Skill**: `fastapi`

```
"Crea middleware de CORS con fastapi"
```

---

### Necesitas: Error handling
**Skills**: `fastapi` + `api-design-principles`

```
"Maneja errores con HTTPException (fastapi)
 y códigos HTTP correctos (api-design-principles)"
```

---

## ✅ TESTING

### Necesitas: Tests de endpoints
**Skill**: `testing-apis`

```bash
# Scenario: Tests para US-001
/opsx:apply us-001-auth
"Escribe tests para GET /auth/me con testing-apis"
```

**Qué testear**:
- Request validation
- Authentication required
- Response schema
- Error cases

---

### Necesitas: Tests de seguridad
**Skill**: `testing-apis` + `secure-auth`

```
"Test passwords hasheados con bcrypt (testing-apis + secure-auth)"
```

---

### Necesitas: Tests de permisos
**Skill**: `testing-apis` + `api-authentication`

```
"Test RBAC - usuario sin permisos debe fallar (testing-apis)"
```

---

## 🎨 ARQUITECTURA & DISEÑO

### Necesitas: Pensar arquitectura general
**Skills**: `api-design-principles` + `database-expert`

```bash
/opsx:explore
"Diseña la arquitectura general del e-commerce
 (api-design-principles + database-expert)"
```

---

### Necesitas: Documentar API
**Skill**: `api-design-principles`

```
"Documenta el contrato de API (api-design-principles)"
```

---

### Necesitas: Decisiones de diseño
**Skills**: `api-design-principles` + `database-expert`

```
"¿Cómo modelar inventario de productos? 
 (database-expert + api-design-principles)"
```

---

## 🔄 POR ETAPA DEL PROYECTO

### EXPLORE (Pensar)
✅ `api-design-principles` - Pensar endpoints  
✅ `database-expert` - Pensar modelo datos  
✅ `api-authentication` - Pensar flujo auth  

**Comando**:
```bash
/opsx:explore us-001
"Ayúdame a pensar autenticación (api-authentication + jwt-authentication)"
```

### PROPOSE (Diseñar)
✅ `api-design-principles` - Diseñar endpoints  
✅ `database-expert` - Diseñar tablas  
✅ `fastapi` - Validaciones Pydantic  

**Comando**:
```bash
/opsx:propose us-001
"Diseña endpoints con api-design-principles y modelo BD con database-expert"
```

### APPLY (Implementar)
✅ `fastapi` - Escribir código  
✅ `database` - Migraciones  
✅ `jwt-authentication` - JWT logic  
✅ `secure-auth` - Password hashing  
✅ `testing-apis` - Tests  

**Comando**:
```bash
/opsx:apply us-001
"Implementa con fastapi, testing-apis, secure-auth, jwt-authentication"
```

### ARCHIVE (Cerrar)
✅ `api-design-principles` - Documentar  
✅ `database-expert` - ERD actualizado  

**Comando**:
```bash
/opsx:archive us-001
```

---

## 📋 MATRIZ DE DECISIÓN RÁPIDA

```
¿Necesitas diseñar?          → api-design-principles
¿Necesitas modelo BD?        → database-expert
¿Necesitas implementar API?  → fastapi
¿Necesitas autenticación?    → api-authentication + jwt-authentication
¿Necesitas hashear pwd?      → secure-auth
¿Necesitas testear?          → testing-apis
¿Necesitas pensar?           → 2-3 skills de diseño
```

---

## 🎯 EJEMPLOS COMPLETOS

### Ejemplo 1: Implementar US-001 (Auth)

```bash
# EXPLORE
/opsx:explore
"Usa api-authentication para entender flujos de autenticación JWT"

# PROPOSE
/opsx:propose us-001-auth
"Diseña endpoints de auth (api-authentication)
 con tokens JWT (jwt-authentication)
 y passwords seguros (secure-auth)"

# APPLY
/opsx:apply us-001-auth
"Implementa:
 1. Endpoint POST /auth/login (fastapi)
 2. Validación con Pydantic (fastapi)
 3. Token JWT (jwt-authentication)
 4. Password hash con bcrypt (secure-auth)
 5. Tests unitarios (testing-apis)"

# ARCHIVE
/opsx:archive us-001-auth
```

---

### Ejemplo 2: Implementar US-003 (Productos)

```bash
# EXPLORE
/opsx:explore
"Diseña modelo de productos + categorías (database-expert)
 y endpoints REST (api-design-principles)"

# PROPOSE
/opsx:propose us-003-productos
"Diseña:
 - Modelo de datos (database-expert)
 - Endpoints CRUD (api-design-principles)
 - Validaciones (fastapi)"

# APPLY
/opsx:apply us-003-productos
"Implementa:
 1. CRUD endpoints (fastapi + api-design-principles)
 2. Validación con Pydantic (fastapi)
 3. Queries optimizadas (database-expert)
 4. Tests (testing-apis)"

# ARCHIVE
/opsx:archive us-003-productos
```

---

## ⚡ ACCESO RÁPIDO

### Menciona skills en prompts
```
# ✅ CORRECTO
"Usa fastapi para implementar GET /categories"
"Diseña con api-design-principles"

# ❌ INCORRECTO
"Implementa esto" (sin mencionar skills)
```

### Combina skills
```
# Autenticación segura
api-authentication + jwt-authentication + secure-auth

# APIs bien diseñadas
api-design-principles + fastapi + testing-apis

# Base de datos optimizada
database-expert + database + api-design-principles
```

---

## 🆘 SI NO SABES CUÁL USAR

1. Lee lo que necesitas hacer
2. Mira la columna "Necesitas" arriba
3. Usa las skills recomendadas
4. Si no coincide, usa `api-design-principles` (es la más versátil)

---

**Última actualización**: 2026-04-20
