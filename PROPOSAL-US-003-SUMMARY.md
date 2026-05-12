# 🎉 PROPUESTA OPSX COMPLETADA: US-003 - Refresh de Tokens

**Fecha**: 2026-05-12  
**Estado**: ✅ LISTA PARA IMPLEMENTACIÓN  
**Artefactos**: 4/4 completados

---

## 📊 Resumen Ejecutivo

Se ha completado la propuesta exhaustiva para **US-003: Refresh de Tokens**, incluyendo diseño técnico, especificaciones detalladas y plan de implementación. El sistema implementará rotación segura de tokens con detección automática de ataques de replay.

### ✅ Artefactos Entregados

| Artefacto | Ruta | Estado | Contenido |
|-----------|------|--------|----------|
| **Proposal** | `proposal.md` | ✅ Done | Por qué, qué cambia, capacidades, impacto |
| **Design** | `design.md` | ✅ Done | 6 decisiones técnicas, riesgos, trade-offs |
| **Specs** | `specs/token-refresh/spec.md` + `specs/auto-refresh-interceptor/spec.md` | ✅ Done | 13 requisitos con escenarios testables |
| **Tasks** | `tasks.md` | ✅ Done | 163 tareas granulares en 20 grupos |

---

## 🎯 Qué Se Implementará

### **Capacidad 1: Token Refresh Seguro**
Endpoint `POST /api/auth/refresh` que:
- Acepta refresh token opaco (UUID v4)
- Retorna nuevo par access + refresh token
- Detecta ataques de replay via `familyId` + `generationCounter`
- Implementa rate limiting (1 refresh/30s por usuario)

### **Capacidad 2: Auto-Refresh Transparente**
Interceptor Axios que:
- Detecta respuestas 401 automáticamente
- Intenta refresh sin intervención del usuario
- Reintenta request original con nuevo token
- Maneja fallos (logout, redirect a login)

---

## 🏗️ Decisiones Técnicas Clave

### 1. **Tokens Opacos + Hashing**
- Refresh token: UUID v4 (no JWT)
- Almacenamiento: bcrypt hash en DB
- Razón: Imposible de adivinar, protegido contra DB dumps

### 2. **Detección de Replay**
- Familia de tokens: agrupan rotaciones del mismo login
- Generación counter: incrementa cada rotación
- Si se recibe generación antigua: revoca TODA la familia
- Razón: Detecta tanto accidentes como ataques maliciosos

### 3. **Transacciones Atómicas**
- Generar nuevo token + marcar anterior como usado en UNA transacción
- Razón: Previene inconsistencias en caso de fallos

### 4. **Rate Limiting**
- Máximo 1 refresh por 30 segundos por usuario
- Razón: Previene spam/abuso

### 5. **Interceptor Automático**
- Axios intercepta 401 → intenta refresh → reintenta request
- Razón: Transparente a la aplicación, mejor UX

---

## 📋 Cobertura de Especificaciones

### **Spec: token-refresh** (8 requisitos)
```
✅ REQ-001: Endpoint refresh retorna nuevo par de tokens
✅ REQ-002: Rotación invalida token anterior
✅ REQ-003: Detección de replay attack
✅ REQ-004: Rate limiting (429)
✅ REQ-005: Expiración de 7 días
✅ REQ-006: No requiere Authorization header
✅ REQ-007: Formato de error estandarizado
✅ REQ-008: Tracking de familias de tokens
```

### **Spec: auto-refresh-interceptor** (7 requisitos)
```
✅ REQ-001: Interceptor detecta 401 y reintenta
✅ REQ-002: Falla gracefully (logout, redirect)
✅ REQ-003: Previene loops infinitos
✅ REQ-004: Sincroniza authStore
✅ REQ-005: Preserva contexto de request
✅ REQ-006: Maneja requests concurrentes
✅ REQ-007: Sincroniza entre tabs
```

---

## 🗂️ Plan de Implementación (20 Grupos)

**Estimación**: 8-10 horas de implementación

| # | Grupo | Tareas | Estimado |
|----|-------|--------|----------|
| 1 | Database & Migration | 6 tareas | 30 min |
| 2 | Backend Data Model | 3 tareas | 20 min |
| 3 | Repository & Service | 4 tareas | 1.5 h |
| 4 | Auth Utilities | 2 tareas | 30 min |
| 5 | API Endpoints | 4 tareas | 1 h |
| 6 | Backend Tests | 4 tareas | 1.5 h |
| 7 | Cleanup Job | 3 tareas | 30 min |
| 8-9 | Frontend Setup | 6 tareas | 1.5 h |
| 10 | Cross-Tab Sync | 3 tareas | 30 min |
| 11-12 | Frontend Tests | 5 tareas | 1 h |
| 13-15 | Quality & Docs | 11 tareas | 1.5 h |
| 16-20 | Merge & Archive | 24 tareas | 1 h |

---

## 🔒 Seguridad

✅ **Tokens opacos** - Imposible de leer/modificar por cliente  
✅ **Hashing bcrypt** - Protege contra DB dumps  
✅ **Replay detection** - Revoca familia completa al detectar reuso  
✅ **Rate limiting** - Previene abuso  
✅ **Atomicidad** - Evita inconsistencias  
✅ **No logging de tokens** - Nunca exponemos en logs/errores  

---

## ⚠️ Riesgos Identificados

| Riesgo | Probabilidad | Mitigación |
|--------|------------|-----------|
| Race condition en refresh | Baja | Transacción atómica + generation counter |
| Crecimiento tabla tokens | Media | Job cleanup cada hora |
| XSS leak de tokens | Media | httpOnly cookie para refresh token |
| Clock skew | Baja | Usar timestamps de DB (UTC) |

---

## 📖 Documentación Generada

✅ **Localización**: `openspec/changes/us-003-refresh-tokens/`

```
├── .openspec.yaml           # Metadata del change
├── proposal.md              # 13 KB - Propuesta + impacto
├── design.md                # 12 KB - Decisiones técnicas
├── tasks.md                 # 18 KB - Checklist de 163 tareas
└── specs/
    ├── token-refresh/spec.md
    └── auto-refresh-interceptor/spec.md
```

---

## 🚀 Próximos Pasos

**Fase APPLY - Implementación**:

```bash
/opsx:apply us-003-refresh-tokens
```

Esto iniciará la fase de codificación donde se ejecutarán las 163 tareas en orden, con tracking automático de progreso.

**Dependencias previas** (ya completadas):
- ✅ US-000 - Setup completo
- ✅ US-001 - Autenticación básica
- ✅ US-002 - Categorías

**Desbloqueará**:
- ⏳ US-004 - Logout (necesita refresh)
- ⏳ US-005 - RBAC (necesita autenticación robusta)

---

## ✨ Características Destacadas

### 1. **Replay Attack Prevention**
Único en este tipo de sistemas - usa `familyId` + `generationCounter` para detectar AUTOMÁTICAMENTE si un token comprom etido se intenta reutilizar, revocando toda la familia instantáneamente.

### 2. **Atomic Token Rotation**
Transacción SQL garantiza que generar nuevo token Y marcar anterior como usado ocurre indivisiblemente, previniendo inconsistencias.

### 3. **Auto-Refresh Transparente**
Usuario no necesita hacer nada - Axios interceptor detecta 401 y refresca automáticamente. Experiencia seamless.

### 4. **Multi-Tab Sync**
Tokens se sincronizan entre tabs automáticamente vía localStorage events, previniendo sesiones huérfanas.

### 5. **Rate Limiting Inteligente**
Solo 1 refresh por 30 segundos previene spam pero permite refresh legítimos en background.

---

## 🎓 Matriz de Trazabilidad

```
User Story (US-003)
    ↓
    ├→ Proposal.md (propósito + impacto)
    ├→ Design.md (6 decisiones técnicas)
    ├→ Specs:
    │  ├→ token-refresh (8 requisitos, 12 escenarios)
    │  └→ auto-refresh-interceptor (7 requisitos, 10 escenarios)
    └→ Tasks.md (163 tareas testables en 20 grupos)
```

**Cada especificación tiene escenarios -> cada escenario es un potencial test case.**

---

## 📞 Contacto y Preguntas

Si hay dudas sobre:
- **Diseño técnico** → Ver `design.md` (Decisiones section)
- **Requisitos** → Ver `specs/` (especificaciones detalladas)
- **Implementación** → Ver `tasks.md` (tareas granulares)
- **Propósito general** → Ver `proposal.md` (contexto y impacto)

---

**Propuesta completada y validada por OPSX CLI.**  
**Estado: ✅ LISTA PARA IMPLEMENTACIÓN**  
**Siguiente comando**: `/opsx:apply us-003-refresh-tokens`

