# Spec: frontend-structure

## Overview
Define la estructura Feature-Sliced Design (FSD) del frontend React con todas las carpetas y configuración base.

## ADDED Requirements

### Requirement: Estructura FSD
El frontend DEBE tener una estructura Feature-Sliced Design.

**Scenarios:**

#### Scenario: Carpetas FSD principales
- **GIVEN** el directorio frontend/src/
- **WHEN** se verifica la estructura
- **THEN** existen: app/, pages/, widgets/, features/, entities/, shared/

#### Scenario: Shared contiene utilidades base
- **GIVEN** el directorio shared/
- **WHEN** se listan archivos
- **THEN** contiene: api/, components/, types/, utils/

### Requirement: Vite configurado
El frontend DEBE tener Vite como build tool y servidor de desarrollo.

**Scenarios:**

#### Scenario: Vite arranca en puerto 5173
- **GIVEN** el proyecto frontend
- **WHEN** se ejecuta npm run dev
- **THEN** el servidor arranca en puerto 5173 sin errores

#### Scenario: Build de producción
- **GIVEN** el proyecto frontend
- **WHEN** se ejecuta npm run build
- **THEN** genera archivos optimizados en dist/

### Requirement: TypeScript strict
El frontend DEBE tener TypeScript en modo estricto.

**Scenarios:**

#### Scenario: Strict mode habilitado
- **GIVEN** tsconfig.json
- **WHEN** se verifica
- **THEN** tiene "strict": true

### Requirement: Tailwind CSS configurado
El frontend DEBE tener Tailwind CSS configurado.

**Scenarios:**

#### Scenario: Tailwind genera clases
- **GIVEN** un componente con clases Tailwind
- **WHEN** se compila
- **THEN** genera CSS con esas clases

### Requirement: React Router configurado
El frontend DEBE tener routing con react-router-dom.

**Scenarios:**

#### Scenario: Routing base configurado
- **GIVEN** el archivo de routing
- **WHEN** se verifica
- **THEN** define rutas públicas y privadas

### Requirement: TanStack Query configurado
El frontend DEBE tener TanStack Query configurado.

**Scenarios:**

#### Scenario: QueryClientProvider envuelve app
- **GIVEN** App.tsx
- **WHEN** se verifica
- **THEN** tiene QueryClientProvider configurado
## Requirements
### Requirement: Estructura FSD
El frontend DEBE tener una estructura Feature-Sliced Design.

**Scenarios:**

#### Scenario: Carpetas FSD principales
- **GIVEN** el directorio frontend/src/
- **WHEN** se verifica la estructura
- **THEN** existen: app/, pages/, widgets/, features/, entities/, shared/

#### Scenario: Shared contiene utilidades base
- **GIVEN** el directorio shared/
- **WHEN** se listan archivos
- **THEN** contiene: api/, components/, types/, utils/

### Requirement: Vite configurado
El frontend DEBE tener Vite como build tool y servidor de desarrollo.

**Scenarios:**

#### Scenario: Vite arranca en puerto 5173
- **GIVEN** el proyecto frontend
- **WHEN** se ejecuta npm run dev
- **THEN** el servidor arranca en puerto 5173 sin errores

#### Scenario: Build de producción
- **GIVEN** el proyecto frontend
- **WHEN** se ejecuta npm run build
- **THEN** genera archivos optimizados en dist/

### Requirement: TypeScript strict
El frontend DEBE tener TypeScript en modo estricto.

**Scenarios:**

#### Scenario: Strict mode habilitado
- **GIVEN** tsconfig.json
- **WHEN** se verifica
- **THEN** tiene "strict": true

### Requirement: Tailwind CSS configurado
El frontend DEBE tener Tailwind CSS configurado.

**Scenarios:**

#### Scenario: Tailwind genera clases
- **GIVEN** un componente con clases Tailwind
- **WHEN** se compila
- **THEN** genera CSS con esas clases

### Requirement: React Router configurado
El frontend DEBE tener routing con react-router-dom.

**Scenarios:**

#### Scenario: Routing base configurado
- **GIVEN** el archivo de routing
- **WHEN** se verifica
- **THEN** define rutas públicas y privadas

### Requirement: TanStack Query configurado
El frontend DEBE tener TanStack Query configurado.

**Scenarios:**

#### Scenario: QueryClientProvider envuelve app
- **GIVEN** App.tsx
- **WHEN** se verifica
- **THEN** tiene QueryClientProvider configurado

