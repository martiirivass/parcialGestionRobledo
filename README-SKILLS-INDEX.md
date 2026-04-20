# 📑 ÍNDICE MAESTRO - Skills & Documentación

Punto de entrada único para toda la documentación de skills.

---

## 🎯 COMIENZA AQUÍ

### Para nuevos en el proyecto
1. Lee: `docs/Descripcion.txt` (qué es Food Store)
2. Lee: `docs/Integrador.txt` (cómo está construido)
3. Lee: `docs/Historias_de_usuario.txt` (qué hay que hacer)
4. **Luego**: Elige una user story y empieza

### Para usar skills
1. **Guía rápida**: `SKILLS-QUICK-START.md` (5 min)
2. **Cuándo usarlas**: `SKILLS-WHEN-TO-USE.md` (referencia)
3. **Todas las skills**: `.agents/SKILLS.md` (documentación completa)

### Para comenzar un change con OPSX
```bash
/opsx:explore [user-story]
/opsx:propose [user-story]
/opsx:apply [user-story]
/opsx:archive [user-story]
```

---

## 📚 DOCUMENTACIÓN DE SKILLS

| Documento | Propósito | Lectura |
|-----------|-----------|---------|
| **SKILLS-INSTALLATION-SUMMARY.md** | Resumen de instalación, checksum | 2 min |
| **SKILLS-QUICK-START.md** | Guía rápida, ejemplos, FAQ | 5 min |
| **SKILLS-WHEN-TO-USE.md** | Matriz: cuándo usar cada skill | 10 min |
| **.agents/SKILLS.md** | Documentación técnica completa | 20 min |

---

## 🛠️ SKILLS DISPONIBLES

### Tier 1: Essenciales (Carga siempre)
- **api-design-principles** - Diseñar APIs REST profesionales
- **fastapi** - Implementar endpoints
- **database-expert** - Optimizar base de datos

### Tier 2: Seguridad (Para autenticación)
- **api-authentication** - Flujos de autenticación
- **jwt-authentication** - JWT tokens y validation
- **secure-auth** - Password hashing y seguridad

### Tier 3: Calidad (Para testing)
- **testing-apis** - Tests de endpoints
- **database** - Database patterns

### Utilidad
- **find-skills** - Buscar e instalar nuevas skills

---

## 🚀 WORKFLOW TÍPICO

### Paso 1: EXPLORE (Pensar)
```bash
/opsx:explore us-001-auth
```
**Qué**: Usa `api-authentication` + `database-expert` para pensar  
**Duración**: 10-15 min  
**Salida**: Entendimiento de la arquitectura

### Paso 2: PROPOSE (Diseñar)
```bash
/opsx:propose us-001-auth
```
**Qué**: Genera `proposal.md`, `design.md`, `tasks.md`  
**Skills**: `api-design-principles`, `database-expert`, `fastapi`  
**Duración**: 20-30 min  
**Salida**: Artefactos en `openspec/changes/us-001-auth/`

### Paso 3: APPLY (Implementar)
```bash
/opsx:apply us-001-auth
```
**Qué**: Escribe código siguiendo tareas  
**Skills**: `fastapi`, `jwt-authentication`, `secure-auth`, `testing-apis`  
**Duración**: 1-2 horas  
**Salida**: Código implementado

### Paso 4: ARCHIVE (Cerrar)
```bash
/opsx:archive us-001-auth
```
**Qué**: Sincroniza specs, cierra el change  
**Duración**: 5 min  
**Salida**: Change archivado

---

## 📋 ESTRUCTURA DE CARPETAS

```
RepositorioBaseFoodStore-SDD/
├── docs/                           ← DOCUMENTACIÓN PRINCIPAL
│   ├── Descripcion.txt            (qué es)
│   ├── Integrador.txt             (cómo está construido)
│   └── Historias_de_usuario.txt   (qué hay que hacer)
│
├── SKILLS-INSTALLATION-SUMMARY.md ← RESUMEN INSTALACIÓN
├── SKILLS-QUICK-START.md          ← GUÍA RÁPIDA
├── SKILLS-WHEN-TO-USE.md          ← CUÁNDO USAR CADA SKILL
│
├── .agents/
│   ├── SKILLS.md                  ← DOCUMENTACIÓN TÉCNICA
│   └── skills/                    ← CARPETA DE SKILLS
│       ├── api-authentication/
│       ├── api-design-principles/
│       ├── database/
│       ├── database-expert/
│       ├── fastapi/
│       ├── find-skills/
│       ├── jwt-authentication/
│       ├── secure-auth/
│       └── testing-apis/
│
├── openspec/                       ← SISTEMA OPSX
│   ├── changes/                    (cambios en progreso)
│   ├── specs/                      (especificaciones maestras)
│   └── .openspec.yaml
│
├── backend/                        ← CÓDIGO BACKEND
├── frontend/                       ← CÓDIGO FRONTEND
└── README.md
```

---

## 🎯 MATRIZ DE USUARIO

| Rol | Comienza aquí | Próximo paso |
|-----|---------------|--------------|
| **Nuevo en el proyecto** | `docs/Descripcion.txt` | `docs/Historias_de_usuario.txt` |
| **Quiero usar skills** | `SKILLS-QUICK-START.md` | `SKILLS-WHEN-TO-USE.md` |
| **Debo implementar US-001** | `SKILLS-WHEN-TO-USE.md` (Auth section) | `/opsx:explore us-001-auth` |
| **Necesito hacer un CRUD API** | `SKILLS-WHEN-TO-USE.md` (API REST section) | `api-design-principles` + `fastapi` |
| **Confundido** | `SKILLS-WHEN-TO-USE.md` (matriz de decisión) | O contacta: Usar `api-design-principles` |

---

## 💡 EJEMPLOS RÁPIDOS

### "Quiero autenticación JWT"
```bash
# Leer
SKILLS-WHEN-TO-USE.md → Sección "AUTENTICACIÓN & SEGURIDAD"

# Hacer
/opsx:explore us-001-auth
"Usa api-authentication para autenticación JWT"
```

### "Quiero CRUD de productos"
```bash
# Leer
SKILLS-WHEN-TO-USE.md → Sección "API REST" + "IMPLEMENTACIÓN FASTAPI"

# Hacer
/opsx:propose us-003-productos
"Diseña con api-design-principles, implementa con fastapi"
```

### "Necesito tests para endpoints"
```bash
# Leer
SKILLS-WHEN-TO-USE.md → Sección "TESTING"

# Hacer
/opsx:apply [cambio]
"Escribe tests con testing-apis"
```

---

## 🔗 ENLACES DIRECTOS

### Documentación de Skills
- `.agents/SKILLS.md` - Técnica completa
- `SKILLS-INSTALLATION-SUMMARY.md` - Checksum
- `SKILLS-QUICK-START.md` - Ejemplos rápidos
- `SKILLS-WHEN-TO-USE.md` - Matriz de decisión

### Documentación del Proyecto
- `docs/Descripcion.txt` - Visión general
- `docs/Integrador.txt` - Arquitectura
- `docs/Historias_de_usuario.txt` - Requerimientos

### Sistema OPSX
- `openspec/.openspec.yaml` - Configuración
- `openspec/changes/` - Cambios en progreso
- `openspec/specs/` - Especificaciones maestras

### Código
- `backend/` - FastAPI + SQLModel
- `frontend/` - React + TypeScript

---

## ⚡ COMANDOS ÚTILES

### OpenSpec
```bash
openspec list --json                          # Ver cambios activos
openspec status --change "us-001-auth" --json # Status de un change
openspec new change "us-002-categorias"       # Crear nuevo change
```

### Skills
```bash
npx skills list                  # Ver skills instaladas
npx skills find [query]          # Buscar nuevas
npx skills add [owner/repo@skill] -y # Instalar
```

### OPSX Workflow
```bash
/opsx:explore [cambio]           # Explorar
/opsx:propose [cambio]           # Proponer
/opsx:apply [cambio]             # Aplicar
/opsx:archive [cambio]           # Archivar
```

---

## 🎓 APRENDIZAJE RECOMENDADO

### Día 1: Onboarding
- [ ] Lee `docs/Descripcion.txt` (10 min)
- [ ] Lee `docs/Integrador.txt` (20 min)
- [ ] Lee `SKILLS-QUICK-START.md` (5 min)

### Día 2: Primera feature
- [ ] Elige una User Story simple (ej: US-002 Categorías)
- [ ] Lee `SKILLS-WHEN-TO-USE.md` (sección relevante)
- [ ] Ejecuta `/opsx:explore`
- [ ] Ejecuta `/opsx:propose`
- [ ] Comienza a implementar

### Día 3+: Consolidar
- [ ] Implementa 2-3 US más
- [ ] Aprende patrones del proyecto
- [ ] Domina las skills más usadas

---

## ❓ FAQ

**P: ¿Por dónde empiezo?**  
R: Lee `SKILLS-QUICK-START.md` (5 min)

**P: ¿Cuál skill uso?**  
R: Lee `SKILLS-WHEN-TO-USE.md` (matriz de decisión)

**P: ¿Cómo hago un cambio?**  
R: `/opsx:explore` → `/opsx:propose` → `/opsx:apply` → `/opsx:archive`

**P: ¿Dónde está la documentación del proyecto?**  
R: En `docs/` carpeta

**P: ¿Puedo agregar más skills?**  
R: Sí, con `npx skills find` y `npx skills add`

**P: ¿Qué hago si algo falla?**  
R: Lee la salida de error, consulta `SKILLS-WHEN-TO-USE.md`, o usa `api-design-principles`

---

## 🎁 BONUS: Checklist para nuevo desarrollador

- [ ] Leer `docs/Descripcion.txt`
- [ ] Leer `docs/Integrador.txt`
- [ ] Leer `SKILLS-QUICK-START.md`
- [ ] Ejecutar `npx skills list` (verificar instalación)
- [ ] Ejecutar `openspec list --json` (ver estado)
- [ ] Escoler una User Story pequeña
- [ ] Ejecutar `/opsx:explore`
- [ ] Leer `SKILLS-WHEN-TO-USE.md` (sección relevante)
- [ ] ✅ ¡LISTO PARA CONSTRUIR!

---

## 📞 SOPORTE

- **Confusión**: Leer esta documentación
- **Error de skill**: Leer `.agents/SKILLS.md`
- **Error de proyecto**: Leer `docs/`
- **Error de OPSX**: Leer `openspec/`

---

**Última actualización**: 2026-04-20  
**Versión**: 1.0  
**Status**: ✅ LISTO PARA PRODUCCIÓN

---

**¡Que disfrutes construyendo! 🚀**
