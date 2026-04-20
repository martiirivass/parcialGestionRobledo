# 🚀 Quick Start: Usando Skills en Food Store

Guía rápida para usar las skills en tu workflow con OPSX.

---

## 1️⃣ ANTES DE EMPEZAR UN CAMBIO

### Paso 1: Lee la historia de usuario
```
docs/Historias_de_usuario.txt
```

### Paso 2: Explora (opcional pero recomendado)
```bash
/opsx:explore us-001-auth
```

Ej:
```
Quiero entender cómo implementar autenticación JWT con RBAC en FastAPI
para el Food Store. Ayúdame a pensar la arquitectura.
```

Las skills que se cargarán automáticamente:
- `api-design-principles` (si mencionas API)
- `database-expert` (si mencionas base de datos)
- `jwt-authentication` (si mencionas JWT)

---

## 2️⃣ CREAR LA PROPUESTA

```bash
/opsx:propose us-001-auth
```

El sistema generará:
- `proposal.md` - Qué vamos a hacer
- `design.md` - Cómo lo haremos (con skills de diseño)
- `tasks.md` - Tareas implementables
- `specs/` - Especificaciones delta

**Tip**: En el prompt de propuesta, menciona qué skill necesitas:

```
Usa la skill jwt-authentication para proponer cómo implementar 
autenticación con refresh tokens en FastAPI
```

---

## 3️⃣ IMPLEMENTAR

```bash
/opsx:apply us-001-auth
```

Las skills que usarás:
- `fastapi` - Para escribir los endpoints
- `secure-auth` - Para password hashing con bcrypt
- `jwt-authentication` - Para generar/validar tokens
- `testing-apis` - Para escribir tests

**Tip**: Di explícitamente qué skill quieres en cada paso:

```
Implementa el endpoint de login usando la skill fastapi.
Asegúrate de hashear passwords con bcrypt (skill secure-auth).
```

---

## 4️⃣ CERRAR EL CAMBIO

```bash
/opsx:archive us-001-auth
```

Sincroniza specs y archiva.

---

## 📚 Guía por Dominio

### 🔐 Autenticación (US-001)
```bash
/opsx:explore
Cargame api-authentication, jwt-authentication, secure-auth
```

Skills: `api-authentication`, `jwt-authentication`, `secure-auth`

### 📦 Base de datos (US-002, US-003)
```bash
/opsx:explore
Cargame database-expert
```

Skills: `database-expert`, `database`, `api-design-principles`

### 🛒 API REST (Todos los US)
```bash
/opsx:propose
Usa api-design-principles para diseñar endpoints RESTful
```

Skills: `api-design-principles`, `fastapi`

### ✅ Testing
```bash
/opsx:apply
Escribe tests con testing-apis
```

Skills: `testing-apis`

---

## 💡 Ejemplos de Prompts Útiles

### Exploración
```
"Explora cómo diseñar el modelo de datos para productos, categorías 
e ingredientes. Usa database-expert para pensar en relaciones y migraciones."
```

### Propuesta
```
"Propón la API REST para productos. Usa api-design-principles 
para endpoints RESTful y database para modelo."
```

### Implementación
```
"Implementa GET /api/v1/products usando fastapi. 
Incluye validación y paginación. Usa api-design-principles."
```

### Testing
```
"Escribe tests para el endpoint POST /api/v1/auth/login 
usando testing-apis. Valida JWT y error handling."
```

---

## 🎯 Matriz Rápida: Skills por Tarea

| Tarea | Skills |
|-------|--------|
| Diseñar API | `api-design-principles` |
| Diseñar DB | `database-expert`, `database` |
| Implementar endpoint | `fastapi` |
| Agregar autenticación | `api-authentication`, `jwt-authentication` |
| Hashear passwords | `secure-auth` |
| Escribir tests | `testing-apis` |
| Pensar arquitectura | `api-design-principles`, `database-expert` |

---

## ⚡ Workflow Completo: Ejemplo US-002 (Categorías)

```bash
# 1. Explorar
/opsx:explore us-002-categorias
> "Ayúdame a pensar categorías jerárquicas con database-expert"

# 2. Proponer
/opsx:propose us-002-categorias
> "Diseña los endpoints CRUD de categorías con api-design-principles
>  y el modelo de datos con database-expert"

# 3. Aplicar
/opsx:apply us-002-categorias
> "Implementa los endpoints con fastapi
>  y los tests con testing-apis"

# 4. Archivar
/opsx:archive us-002-categorias
```

---

## 🔧 Comandos Útiles

### Ver skills instaladas
```bash
npx skills list
```

### Actualizar skills
```bash
npx skills check
npx skills update
```

### Ver estado del cambio actual
```bash
openspec status --change "us-001-auth" --json
```

### Ver cambios activos
```bash
openspec list --json
```

---

## 📖 Leer Skills SKILL.md

Cada skill tiene documentación. Léela antes de usarla:

```bash
# Ej: leer la skill de FastAPI
cat .agents/skills/fastapi/SKILL.md
```

---

## ❓ FAQ

**P: ¿Qué skill cargo primero?**  
R: Depende de lo que hagas:
- Diseño → `api-design-principles`
- DB → `database-expert`
- Backend → `fastapi`

**P: ¿Puedo cargar múltiples skills?**  
R: Sí. En el prompt simplemente menciona todas las que necesites.

**P: ¿Qué skill uso si no sé cuál?**  
R: Comienza con `api-design-principles` — es la más versátil.

**P: ¿testing-apis es segura?**  
R: Tiene alertas (High Risk). Úsala para testing/development, no en producción.

**P: ¿Puedo agregar más skills?**  
R: Sí, con `npx skills find [query]` y `npx skills add [skill]`

---

## 🎓 Próximos Pasos

1. Lee `docs/Descripcion.txt` para entender el sistema
2. Lee `docs/Integrador.txt` para ver la arquitectura
3. Lee `docs/Historias_de_usuario.txt` para ver qué construir
4. Elige una US
5. Sigue el workflow: explore → propose → apply → archive

¡A construir! 🚀

---

**Última actualización**: 2026-04-20
