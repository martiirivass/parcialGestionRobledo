# Engram Git Sync — Guía de Configuración para el Equipo

Sincroniza las memorias de Engram entre todos los compañeros de equipo через Git.

---

## Cómo Funciona

```
┌──────────────────────────────────────────────────────────┐
│  Cada desarrollador tiene su BD local (~/.engram/)        │
│                                                           │
│  Antes de commit:  engram sync  → .engram/chunks/       │
│  Después de pull:   engram sync --import → BD local     │
│                                                           │
│  .engram/ se commitea al repo → todos comparten memorias│
└──────────────────────────────────────────────────────────┘
```

- Los chunks son **gzip JSONL** → archivos pequeños
- Append-only → **sin conflictos de merge**
- El import es idempotente → cada chunk se importa una sola vez

---

## Requisitos Previos

1. **Engram instalado** en cada máquina
2. **Git** funcionando
3. Repo clonado localmente

---

## Paso 1: Instalar Engram (solo una vez)

### Windows (Go instalado)
```powershell
go install github.com/Gentleman-Programming/engram/cmd/engram@latest
```

### Verificar
```powershell
engram version
# → engram 1.15.11 (o la versión que sea)
```

---

## Paso 2: Configurar Engram en OpenCode (solo una vez)

```powershell
engram setup opencode
```

Esto:
- Instala el plugin de Engram en `~/.config/opencode/plugins/`
- Registra el servidor MCP en `opencode.json`
- Auto-inicia el servidor HTTP en puerto 7437

**Reiniciar OpenCode** después de esto.

---

## Paso 3: Setup Inicial del Repo (solo una vez por repo)

El directorio `.engram/` ya está creado en el repo. Solo necesitas hacer el primer sync para inicializar la BD local:

```bash
# Desde la raíz del repo
cd RepositorioBaseFoodStore-SDD
engram sync --import
engram sync
```

---

## Uso Diario

### Flujo de trabajo completo

```bash
# 1. Pullear cambios (trae memorias de compañeros)
git pull

# 2. Importar nuevas memorias del equipo
engram sync --import

# 3. Trabajar normalmente...
#    Engram guarda memorias automáticamente

# 4. Antes de hacer commit de código, sincronizar tus memorias
engram sync

# 5. Commitear
git add .engram/
git commit -m "sync: update engram memories"
git push
```

### Ver estado
```bash
engram sync --status
```

### Ver tus memorias
```bash
engram search "auth" --project RepositorioBaseFoodStore-SDD
engram stats
engram context
```

### TUI interactiva
```bash
engram tui
```

---

## Comandos Rápidos de Referencia

| Comando | Qué hace |
|---------|----------|
| `engram sync` | Exporta tus memorias nuevas al repo |
| `engram sync --import` | Importa memorias nuevas del repo a tu BD |
| `engram sync --status` | Muestra cuántos chunks hay pendientes |
| `engram search <query>` | Buscar en tus memorias |
| `engram context` | Contexto de sesiones recientes |
| `engram stats` | Estadísticas del sistema de memorias |
| `engram serve` | Iniciar el servidor HTTP (se hace auto) |

---

## Estructura de `.engram/`

```
.engram/
├── manifest.json       # Índice de chunks (se autogestiona)
├── chunks/            # Memorias comprimidas (gzip JSONL)
│   ├── 2025-12-01T10-00-00-abc123.jsonl.gz
│   ├── 2025-12-03T14-30-00-def456.jsonl.gz
│   └── ...
└── .gitkeep           # Mantener el dir en git
```

---

## Solución de Problemas

### "engram not found"
```powershell
# Verifica que esté en el PATH
engram version

# Si no funciona, agrega manualmente:
[Environment]::SetEnvironmentVariable(
  "Path",
  "$env:USERPROFILE\go\bin;" + [Environment]::GetEnvironmentVariable("Path","User"),
  "User"
)
# Reinicia la terminal
```

### Conflictos de merge en `.engram/`
Los chunks son append-only → conflictos raramente ocurren.
Si pasa, acepta ambos archivos y luego:
```bash
engram sync --import
engram sync
```

### El servidor no arranca
```bash
engram serve
# Deja corriendo en otra terminal
```

---

## Tips para el Equipo

1. **Sync antes de push** — asegúrate de que tus memorias se exporten
2. **Sync --import después de pull** — carga las memorias nuevas
3. **No borres `.engram/`** — contiene las memorias compartidas
4. **Revisa `engram stats`** periódicamente para ver cuántas memorias tienes
5. **Usa `engram context`** al iniciar sesión para recuperar contexto previo

---

## Docs Oficiales

- Repo: https://github.com/Gentleman-Programming/engram
- Docs: https://docs.engram.host/
- Agentes: https://mintlify.com/Gentleman-Programming/engram/agents/overview
