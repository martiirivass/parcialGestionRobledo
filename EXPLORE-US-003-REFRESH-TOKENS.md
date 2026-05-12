# OPSX Explore: US-003 - Refresh de Tokens

**Fecha**: 2026-05-12  
**Estado**: Exploration Phase  
**Objetivo**: Entender y validar la arquitectura de refresh de tokens antes de implementar

---

## 📋 Información de la User Story

**ID**: US-003  
**Título**: Refresh de token  
**Descripción**: Renovación automática de sesión  
**Historia**: Como **Sistema**, quiero rotar los tokens de acceso usando el refresh token, para mantener la sesión del usuario activa de forma segura.

**Prioridad**: Alta  
**Dependencias**: US-002 ✅ (Completado)

---

## 🎯 Criterios de Aceptación

1. ✅ GIVEN un refresh token válido y no expirado  
   WHEN se envía al endpoint de refresh  
   THEN se genera un nuevo par access + refresh token y se invalida el refresh token anterior (rotación)

2. ✅ GIVEN un refresh token expirado  
   WHEN se envía al endpoint  
   THEN se retorna 401 y el usuario debe re-loguearse

3. ✅ GIVEN un refresh token ya utilizado (replay attack)  
   WHEN se envía  
   THEN se invalidan TODOS los refresh tokens del usuario y se retorna 401

4. ✅ El nuevo refresh token tiene una nueva fecha de expiración (7 días desde la emisión)

---

## 🔍 Análisis de Reglas de Negocio Relacionadas

Del archivo `docs/Historias_de_usuario.txt`:

| ID      | Regla | Historias |
|---------|-------|-----------|
| RN-AU02 | Access token JWT: 30 min, contiene userId/email/roles, firmado HS256 | US-002, US-003 |
| RN-AU03 | Refresh token: 7 días, UUID v4 opaco almacenado en BD | US-002, US-003 |
| RN-AU04 | **Rotación de refresh tokens**: al usar uno, se revoca el anterior y se emite uno nuevo | US-003 ✨ |
| RN-AU05 | **Detección de replay attack**: si se reutiliza un token ya usado, revocar TODOS los del usuario | US-003 ✨ |

---

## 🏗️ Análisis de Notas Técnicas

```
Endpoint: POST /api/auth/refresh
Familia de tokens: cada refresh token tiene un `familyId` para detectar reuso
Almacenamiento: BD con flag `used`
```

**Implicaciones de diseño**:
- Cada refresh token necesita: `id`, `userId`, `familyId`, `used`, `expiresAt`, `createdAt`
- Detección de replay: comparar `familyId` de tokens anteriores
- Rotación: generar nuevo token con nuevo `familyId`

---

## 🗂️ Dependencias Técnicas

### Backend Existente (Verificado ✅)

**Autenticación JWT** (US-001, US-002):
- `backend/app/core/security.py` - Funciones de JWT
- `backend/app/core/dependencies.py` - `get_current_user`
- `backend/app/auth/router.py` - Endpoints `/login`, `/register`
- `backend/app/auth/service.py` - Lógica de autenticación

**Base de Datos**:
- `backend/app/models/usuario.py` - Modelo User

### Nuevos Componentes Necesarios

**Backend**:
- [ ] Modelo `RefreshToken` con campos: `id`, `userId`, `familyId`, `token`, `used`, `expiresAt`, `createdAt`, `revokedAt`
- [ ] Tabla `refresh_tokens` en BD
- [ ] Endpoint `POST /api/auth/refresh` en `backend/app/auth/router.py`
- [ ] Función `refresh_token()` en `backend/app/auth/service.py`
- [ ] Repository para refresh tokens

**Frontend**:
- [ ] Interceptor de Axios para capturar 401 → intentar refresh automático
- [ ] Actualizar `authStore` en `frontend/src/features/auth/store/`
- [ ] Método `updateTokens()` en el store

---

## 📊 Análisis de Complejidad

### Desafíos Identificados

1. **Detección de Replay Attack** ⚠️  
   - Necesario mantener `familyId` para cada generación
   - Si se detecta replay: revocar TODOS los tokens de la familia
   - Riesgo: condición de carrera si se usan múltiples refresh en paralelo

2. **Rotación de Tokens Segura** ⚠️  
   - Generar nuevo token ANTES de invalidar el anterior (ventana de tiempo)
   - Sincronización frontend/backend

3. **Manejo de Expiración** ⚠️  
   - Refresh token expirado → 401 → user debe re-loguearse
   - Necesario limpiar tokens expirados periódicamente (cleanup task)

4. **Transacciones Atómicas** ⚠️  
   - Generar nuevo token + marcar anterior como usado debe ser ATÓMICA
   - Si falla a mitad: estado inconsistente

### Soluciones Propuestas

✅ **Detección de Replay**: Comparar `familyId` en BD antes de emitir nuevo token  
✅ **Rotación Segura**: Generar nuevo token en misma transacción que invalida el anterior  
✅ **Expiración**: Usar job asyncio para limpiar tokens expirados cada hora  
✅ **Atomicidad**: Usar SQLAlchemy transaction (`async with session`)  

---

## 🎨 Decisiones de Diseño

### 1. Generación de Refresh Token

**Opción 1**: UUID v4 opaco ✅ (Seleccionado)
- Seguridad: imposible adivinar
- Almacenamiento: solo hash en BD (comparar al validar)
- Retorno: token completo al cliente

**Opción 2**: JWT con claims
- Riesgo: claims pueden ser leídos sin validar
- No recomendado para refresh tokens

### 2. Detección de Replay

**Opción 1**: `familyId` + `generationCounter` ✅ (Seleccionado)
- Cada rotación incrementa counter
- Si recibimos token con counter antigua: replay detectado
- Invalidar toda la familia

**Opción 2**: Whitelist de tokens válidos
- Complejidad: mantener lista de válidos
- Performance: búsqueda O(n)

### 3. Almacenamiento en BD

**Campos necesarios**:
```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id),
    family_id UUID NOT NULL,  -- agrupa rotaciones relacionadas
    token_hash VARCHAR(255) NOT NULL,  -- bcrypt(token)
    generacion INT NOT NULL DEFAULT 1,
    usado_en TIMESTAMP NULL,
    revocado_en TIMESTAMP NULL,
    expira_en TIMESTAMP NOT NULL,
    creado_en TIMESTAMP DEFAULT NOW()
);
```

---

## 📈 Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|--------|-----------|
| Replay attack | Media | Alto | Detección por familyId + generación |
| Race condition | Baja | Alto | Usar transacción SQL |
| Token expirado acumulado | Media | Bajo | Cleanup job periódico |
| Tokens huérfanos | Baja | Bajo | Constraint FOREIGN KEY |

---

## 🔌 Integración con Componentes Existentes

### Frontend (Zustand + Axios)

**Flujo actual**:
```
User → Login → axios.post(/auth/login) → get access + refresh token
     → authStore.login(tokens)
     → localStorage.setItem('tokens', ...)
```

**Flujo con refresh**:
```
User → API call (token expirado)
     → 401 Unauthorized
     → axios interceptor
     → axios.post(/auth/refresh, { refreshToken })
     → get new access + refresh token
     → authStore.updateTokens(newTokens)
     → Retry original request
```

**Código necesario**:
```typescript
// frontend/src/shared/api/interceptors.ts
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      try {
        const { refreshToken } = authStore.getState();
        const { data } = await axiosInstance.post('/auth/refresh', { 
          refreshToken 
        });
        authStore.setState(data.tokens);
        // Retry original request
        return axiosInstance(error.config);
      } catch (refreshError) {
        authStore.logout();
        throw refreshError;
      }
    }
    throw error;
  }
);
```

---

## 📝 Preguntas sin Resolver

1. **¿Cleanup automático de tokens expirados?**  
   - Cada request: costoso
   - Job background: necesario AsyncIO
   - Propuesta: Job cada hora

2. **¿Timeout entre refresh calls?**  
   - Evitar refresh spam
   - Propuesta: Máximo 1 refresh por 1 minuto

3. **¿Almacenamiento del refresh token en cliente?**  
   - localStorage: vulnerable a XSS
   - httpOnly cookie: protegido pero no accesible desde JS
   - Propuesta: httpOnly cookie + token opaco

4. **¿Invalidar todos los tokens en logout?**  
   - Sí: cada logout revoca toda la familia
   - Atomicidad: importante

---

## ✅ Conclusiones de la Exploración

### Estado Actual: LISTO PARA PROPONER

**Razones**:
1. ✅ Dependencia (US-002) está completa
2. ✅ Reglas de negocio claras (RN-AU03, RN-AU04, RN-AU05)
3. ✅ Arquitectura identificada (JWT + familyId + BD)
4. ✅ Riesgos comprendidos y mitigables
5. ✅ Integración con componentes existentes clara

### Recomendación

**Proceder a fase PROPOSE** para:
- Crear propuesta.md con contexto ampliado
- Crear design.md con especificaciones técnicas exactas
- Crear tasks.md con checklist granular

### Siguiente Paso

```bash
/opsx:propose us-003-refresh-tokens
```

---

**Exploración completada por**: Orchestrator Agent  
**Fecha**: 2026-05-12 12:45 UTC  
**Tiempo estimado de implementación**: 8-10 horas  
**Complejidad**: Media-Alta (por detección de replay y transacciones)
