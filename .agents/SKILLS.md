# 🎯 Skills Instaladas para Food Store

Documento que describe todas las skills instaladas en el proyecto y sus propósitos.

---

## 📋 Inventario de Skills

### **PRIORIDAD ALTA** - Arquitectura y Diseño

#### 1. **api-design-principles** ⭐⭐⭐
- **Fuente**: wshobson/agents
- **Installs**: 18K
- **Propósito**: Principios de diseño de APIs REST, mejores prácticas RESTful y patrones de arquitectura
- **Uso en el proyecto**: Diseño de endpoints FastAPI (usuarios, productos, pedidos, pagos)
- **Security**: Safe, 0 alerts
- **Ubicación**: `.agents/skills/api-design-principles/`

#### 2. **database-expert** ⭐⭐⭐
- **Fuente**: travisjneuman/.claude
- **Installs**: 141
- **Propósito**: Expertise en diseño de bases de datos, optimización, queries, índices
- **Uso en el proyecto**: Diseño del modelo ERD, migraciones Alembic, optimización PostgreSQL
- **Security**: Safe, 0 alerts
- **Ubicación**: `.agents/skills/database-expert/`

#### 3. **api-authentication** ⭐⭐⭐
- **Fuente**: secondsky/claude-skills
- **Installs**: 169
- **Propósito**: Autenticación de APIs, JWT, RBAC (Role-Based Access Control), tokens
- **Uso en el proyecto**: Implementar US-001 (autenticación con JWT, refresh tokens, RBAC)
- **Security**: Safe, 0 alerts
- **Ubicación**: `.agents/skills/api-authentication/`

#### 4. **jwt-authentication** ⭐⭐⭐
- **Fuente**: pluginagentmarketplace/custom-plugin-nodejs
- **Installs**: 115
- **Propósito**: JWT específico, token generation, validation, signing
- **Uso en el proyecto**: Detalles técnicos de JWT con python-jose en FastAPI
- **Security**: Low Risk, 0 alerts
- **Ubicación**: `.agents/skills/jwt-authentication/`

---

### **PRIORIDAD MEDIA** - Backend Especializado

#### 5. **fastapi** ⭐⭐⭐
- **Fuente**: itechmeat/llm-code
- **Installs**: 57
- **Propósito**: Patterns específicos de FastAPI, validación, dependency injection
- **Uso en el proyecto**: Desarrollo de endpoints, middleware, validación con Pydantic
- **Security**: Safe, 0 alerts
- **Ubicación**: `.agents/skills/fastapi/`

#### 6. **database** ⭐⭐⭐
- **Fuente**: miles990/claude-software-skills
- **Installs**: 54
- **Propósito**: Database design patterns, relaciones, migraciones
- **Uso en el proyecto**: Diseño de tablas, relaciones, constraints (PostgreSQL + SQLModel)
- **Security**: Safe, 0 alerts
- **Ubicación**: `.agents/skills/database/`

#### 7. **testing-apis** ⭐⭐
- **Fuente**: trilwu/secskills
- **Installs**: 14
- **Propósito**: Testing de APIs, seguridad, fuzzing, validación
- **Uso en el proyecto**: Tests para endpoints FastAPI, validación de respuestas
- **Security**: Med Risk, 1 alert, High Risk (revisar antes de usar en producción)
- **Ubicación**: `.agents/skills/testing-apis/`

#### 8. **secure-auth** ⭐⭐
- **Fuente**: jamditis/claude-skills-journalism
- **Installs**: 80
- **Propósito**: Seguridad en autenticación, password hashing, security best practices
- **Uso en el proyecto**: Implementación segura de bcrypt, manejo de credenciales
- **Security**: Safe, 0 alerts
- **Ubicación**: `.agents/skills/secure-auth/`

---

### **UTILIDADES**

#### 9. **find-skills** 🔍
- **Fuente**: Incluido en el proyecto
- **Propósito**: Skill para buscar e instalar nuevas skills del ecosistema
- **Ubicación**: `.agents/skills/find-skills/`

---

## 🚀 Cómo Usar Estas Skills

### Cuando Propones un Change

Antes de trabajar en cualquier feature, **carga las skills relevantes**:

```bash
# Para diseño de API
/opsx:propose us-002-categorias

# El sistema automáticamente puede usar:
# - api-design-principles
# - fastapi
# - database
```

### Cargando Skills Manualmente

En Cline o OpenCode, di:

```
Carga la skill de jwt-authentication y ayúdame a implementar US-001
```

### Patrón de Uso en OPSX

1. **Explore phase** → usa `database-expert` y `api-design-principles`
2. **Propose phase** → skills de diseño generan propuestas mejores
3. **Apply phase** → `fastapi`, `database`, `secure-auth` para implementación
4. **Archive phase** → toda documentación usa `api-design-principles`

---

## 🎯 Mapeo Skills → User Stories

| User Story | Skills Recomendadas |
|------------|-------------------|
| US-001 (Auth) | `api-authentication`, `jwt-authentication`, `secure-auth` |
| US-002 (Categorías) | `api-design-principles`, `database`, `fastapi` |
| US-003 (Productos) | `database-expert`, `fastapi` |
| US-004 (Carrito) | `fastapi` |
| US-005 (Pedidos) | `database-expert`, `api-design-principles` |
| US-006 (MercadoPago) | `api-design-principles`, `testing-apis` |
| US-007 (Admin) | `api-design-principles`, `database` |
| Todos | `testing-apis` (para testing de endpoints) |

---

## ⚠️ Notas de Seguridad

- **testing-apis**: Tiene alerts de seguridad (High Risk). Úsalo para development/testing, no en producción.
- **secure-auth**: Garantiza implementación segura de autenticación.
- Todas las demás skills son Safe con 0 alerts.

---

## 📚 Recursos Adicionales

Ver documentación completa en:
- `openspec/` - Sistema de cambios y especificaciones
- `docs/` - Documentación del proyecto (Descripcion.txt, Integrador.txt, Historias_de_usuario.txt)
- Cada skill tiene su propia carpeta con SKILL.md

---

## ✅ Checklist para Nuevos Cambios

Antes de empezar cualquier feature:

- [ ] Leer la user story en `docs/Historias_de_usuario.txt`
- [ ] Identificar qué skills aplican (tabla de arriba)
- [ ] Ejecutar `/opsx:explore` si necesitas pensar
- [ ] Ejecutar `/opsx:propose` con contexto de skills
- [ ] Usar `/opsx:apply` con las skills cargadas
- [ ] Usar `testing-apis` para escribir tests
- [ ] Cerrar con `/opsx:archive`

---

**Última actualización**: 2026-04-20  
**Total de skills**: 9 (8 instaladas + 1 utilitaria)
