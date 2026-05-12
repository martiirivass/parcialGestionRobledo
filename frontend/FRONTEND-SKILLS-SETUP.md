# 🚀 Skills de Frontend Moderno - Instalación y Configuración

**Fecha:** 12 de Mayo 2026  
**Status:** ✅ Completado  
**Skills Instaladas:** 4

---

## ✅ Lo Que Se Instaló

### 1. **shadcn/ui** (136.2K installs ⭐114K GitHub stars)
- **Rol:** Componentes SaaS profesionales
- **Incluye:** Sidebar, Navbar, Card, Dialog, Table, Chart, Form, etc.
- **Compatibilidad:** React 18+, TypeScript, Tailwind v3/v4
- **Link:** https://ui.shadcn.com

### 2. **tailwind-design-system** (40.8K installs ⭐35K GitHub stars)
- **Rol:** Arquitectura de design tokens y sistema de componentes
- **Incluye:** CVA (Class Variance Authority), compound components, tokens OKLCH
- **Compatibilidad:** Tailwind v3/v4, React 18+
- **Link:** https://github.com/wshobson/agents

### 3. **frontend-design** (398K installs ⭐132K GitHub stars)
- **Rol:** Estética visual y motion distinctivas
- **Incluye:** Typography, color, motion, spatial composition, animations
- **Compatibilidad:** HTML/CSS, React, Vue
- **Link:** https://github.com/anthropics/skills

### 4. **web-design-guidelines** (312.3K installs ⭐26K GitHub stars)
- **Rol:** Auditor de mejores prácticas Vercel
- **Incluye:** Spacing, typography, interaction, accessibility
- **Compatibilidad:** Cualquier proyecto web
- **Link:** https://github.com/vercel-labs/agent-skills

---

## 📁 Archivos Creados

### `components.json` - Configuración de shadcn/ui
```json
{
  "style": "default",
  "tsx": true,
  "aliasPrefix": "@",
  "aliases": {
    "@": "./src",
    "@/components": "./src/components",
    "@/lib": "./src/lib",
    // ... (alias mapping completo)
  }
}
```

### `src/lib/utils.ts` - Utilidad `cn()`
```typescript
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Directorios Creados
```
src/
├── components/
│   └── ui/              ← Donde shadcn/ui coloca componentes
├── hooks/               ← Custom React hooks
├── lib/                 ← Utilidades y helpers
└── shared/
    ├── utils/           ← Ya existía
    └── types/           ← Ya existía
```

### Dependencias Instaladas
```bash
npm install clsx tailwind-merge
```

---

## 🎯 Próximos Pasos

### **PASO 1: Verificar Instalación**

```bash
# En el directorio frontend/
npx shadcn@latest --version
```

Deberías ver algo como:
```
shadcn-ui@3.x.x
```

### **PASO 2: Inicializar shadcn/ui (Opcional - Si Quieres Aplicar Preset)**

```bash
# Inicializar con preset "nova" (SaaS moderno)
npx shadcn@latest init --preset nova

# O inicializar con preset "base-nova" (Más minimalista)
npx shadcn@latest init --preset base-nova
```

**¿Qué hace esto?**
- Actualiza CSS variables en Tailwind
- Define tema de colores cohesivo
- Configura fuentes recomendadas

### **PASO 3: Agregar Componentes Esenciales para Dashboard**

```bash
# Componentes para sidebar y navbar
npx shadcn@latest add sidebar
npx shadcn@latest add navigation-menu

# Componentes para layout
npx shadcn@latest add card
npx shadcn@latest add button
npx shadcn@latest add input

# Componentes para formularios
npx shadcn@latest add select
npx shadcn@latest add checkbox
npx shadcn@latest add radio-group

# Componentes para datos
npx shadcn@latest add table
npx shadcn@latest add chart

# Componentes para overlays
npx shadcn@latest add dialog
npx shadcn@latest add sheet
npx shadcn@latest add popover
```

### **PASO 4: Crear Layout Base (Sidebar + Navbar)**

Crea `src/layouts/DashboardLayout.tsx`:

```typescript
import React from 'react';
import { Sidebar } from '@/components/ui/sidebar';
import { Header } from './Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### **PASO 5: Aplicar Diseño Personalizado**

Usa la skill `frontend-design` para:
- Definir dirección visual (brutalist, minimalist, SaaS, etc.)
- Elegir paleta de colores
- Configurar motion y animaciones
- Refinar typography

**Ejemplo:**
```
"Crea un dashboard SaaS minimalista con tema luxury, 
colores oscuros con acentos dorados, animaciones smooth."
```

### **PASO 6: Validar Código Contra Guidelines**

```bash
# Auditar archivos contra Vercel guidelines
web-design-guidelines src/
```

---

## 💡 Patrones a Seguir

### ✅ Estructura de Componente shadcn

```typescript
// ✅ CORRECTO - Usando shadcn
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Título</CardTitle>
      </CardHeader>
      <Button>Acción</Button>
    </Card>
  );
}
```

### ✅ Usar `cn()` para Clases Condicionales

```typescript
// ✅ CORRECTO - Con cn()
import { cn } from "@/lib/utils";

export function Badge({ variant, children }: Props) {
  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-sm font-medium",
      variant === "primary" && "bg-blue-500 text-white",
      variant === "secondary" && "bg-gray-200 text-gray-800"
    )}>
      {children}
    </span>
  );
}

// ❌ EVITAR - Sin cn()
export function Badge({ variant, children }: Props) {
  const className = variant === "primary" 
    ? "px-3 py-1 rounded-full bg-blue-500 text-white" 
    : "px-3 py-1 rounded-full bg-gray-200 text-gray-800";
  return <span className={className}>{children}</span>;
}
```

### ✅ Semantic Colors

```typescript
// ✅ CORRECTO - Colores semánticos
<div className="bg-primary text-primary-foreground">
<button className="bg-destructive hover:bg-destructive/90">

// ❌ EVITAR - Colores raw
<div className="bg-blue-500 text-white">
<button className="bg-red-500 hover:bg-red-600">
```

### ✅ Spacing con `gap`

```typescript
// ✅ CORRECTO - Usar gap en flex
<div className="flex flex-col gap-4">
  <Item />
  <Item />
</div>

// ❌ EVITAR - space-y-*
<div className="space-y-4">
  <Item />
  <Item />
</div>
```

---

## 📚 Documentación Útil

| Recurso | URL |
|---------|-----|
| **shadcn/ui** | https://ui.shadcn.com |
| **Tailwind CSS** | https://tailwindcss.com |
| **Class Variance Authority** | https://cva.style/docs |
| **Vercel Guidelines** | https://github.com/vercel-labs/web-interface-guidelines |

---

## 🎨 Configuración Recomendada para Tu Dashboard

### Tema: **SaaS Moderno Minimalista**

#### Paleta de Colores
```css
/* Usar colores semánticos en lugar de raw */
--primary: oklch(45% 0.15 250)        /* Azul profesional */
--secondary: oklch(85% 0.05 250)      /* Gris claro */
--accent: oklch(52% 0.24 40)          /* Naranja energético */
--destructive: oklch(53% 0.22 27)     /* Rojo de error */
--background: oklch(100% 0 0)         /* Blanco puro */
--foreground: oklch(14% 0.025 264)    /* Negro suave */
```

#### Typography
- **Display:** `Geist` o `Inter Tight` (fuentes sans-serif modernas)
- **Body:** `Inter` o `Geist` (legibilidad en texto largo)
- **Mono:** `JetBrains Mono` o `Courier Prime` (código)

#### Motion
```css
/* Transiciones suaves */
transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);

/* Animaciones de entrada */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

#### Responsive
```typescript
// Mobile First
"px-4 py-2"                    // mobile
"sm:px-6 sm:py-4"             // tablet
"lg:px-8 lg:py-6"             // desktop
```

---

## 🔧 Comandos Útiles

```bash
# Ver configuración actual de shadcn
npx shadcn@latest info

# Buscar componentes disponibles
npx shadcn@latest search sidebar

# Ver documentación de un componente
npx shadcn@latest docs button

# Agregar múltiples componentes
npx shadcn@latest add card button input dialog

# Actualizar componente a versión nueva
npx shadcn@latest add card --overwrite

# Ver cambios antes de aplicarlos
npx shadcn@latest add card --dry-run --diff
```

---

## ⚠️ Notas Importantes

1. **Tailwind v3**: Tu proyecto usa v3. shadcn funciona perfectamente.
   - Si quieres usar v4, hay opciones (`@theme` blocks), pero no es obligatorio.

2. **Componentes personalizados**: Todos los componentes de shadcn se añaden como código fuente en `src/components/ui/`.
   - Puedes modificarlos libremente.

3. **No es un package**: shadcn/ui **no es una librería npm**.
   - Los componentes se clonan a tu proyecto.
   - Tú tienes control total sobre el código.

4. **Compatible con Zustand**: Tu estado global (carrito, auth) sigue en Zustand.
   - shadcn proporciona UI, Zustand proporciona state.

5. **TypeScript**: Todos los componentes vienen tipados.
   - Aprovecha las props y types para autocompletar.

---

## 📦 Resumen de Stack Final

```
┌─────────────────────────────────────────────┐
│         REACT 18 + TYPESCRIPT               │
├─────────────────────────────────────────────┤
│  Componentes     │ shadcn/ui (Sidebar,     │
│                  │ Card, Table, Dialog)    │
├─────────────────────────────────────────────┤
│  Styling         │ Tailwind v3 + tokens    │
│                  │ (tailwind-design-system)│
├─────────────────────────────────────────────┤
│  Motion          │ CSS animations +        │
│                  │ frontend-design        │
├─────────────────────────────────────────────┤
│  State           │ Zustand + TanStack Query│
├─────────────────────────────────────────────┤
│  Routing         │ React Router DOM v6     │
├─────────────────────────────────────────────┤
│  HTTP Client     │ Axios                   │
└─────────────────────────────────────────────┘
```

---

## 🎓 Próximo Tutorial

Cuando estés listo para crear el dashboard:

1. Lee la documentación de `shadcn` (haz clic en tus componentes)
2. Usa la skill `frontend-design` para definir la estética
3. Crea el layout base (Sidebar + Header)
4. Agrega componentes según necesites
5. Audita con `web-design-guidelines`

---

**¿Dudas o necesitas más ayuda?**

- Documenta en `openspec/changes/` para cambios específicos
- Carga la skill `shadcn` cuando necesites agregar/modificar componentes
- Usa `frontend-design` para decisiones estéticas complejas

**Happy coding! 🚀**
