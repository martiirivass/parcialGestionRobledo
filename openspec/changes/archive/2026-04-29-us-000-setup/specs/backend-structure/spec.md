# Spec: backend-structure

## Overview
Define la estructura feature-first del backend FastAPI con todos los módulos necesarios para el sistema Food Store.

## ADDED Requirements

### Requirement: Estructura de carpetas feature-first
El backend DEBE tener una estructura de carpetas feature-first donde cada módulo funcional contiene todos sus archivos relacionados.

**Scenarios:**

#### Scenario: Módulos principales existen
- **GIVEN** el directorio backend/
- **WHEN** se verifica la estructura
- **THEN** existen las carpetas: auth/, usuarios/, categorias/, productos/, ingredientes/, pedidos/, pagos/, direcciones/, admin/, refreshtokens/

#### Scenario: Cada módulo contiene archivos requeridos
- **GIVEN** un módulo (ej: auth/)
- **WHEN** se listan sus archivos
- **THEN** contiene: model.py, schemas.py, repository.py, service.py, router.py

### Requirement: Archivo main.py con configuración base
El backend DEBE tener un archivo app/main.py que configure FastAPI con middleware y routers.

**Scenarios:**

#### Scenario: FastAPI app configurada
- **GIVEN** el archivo app/main.py
- **WHEN** se importa y ejecuta uvicorn
- **THEN** el servidor arranca en puerto 8000 sin errores

#### Scenario: Documentación accesible
- **GIVEN** el servidor corriendo
- **WHEN** se accede a /docs
- **THEN** muestra la documentación Swagger

#### Scenario: CORS configurado
- **GIVEN** la app FastAPI
- **WHEN** se hace request desde origen configurado en CORS_ORIGINS
- **THEN** la respuesta incluye headers CORS correctos

### Requirement: Módulos core
El backend DEBE tener un directorio core/ con configuración centralizada.

**Scenarios:**

#### Scenario: Core config existe
- **GIVEN** el directorio app/core/
- **WHEN** se listan archivos
- **THEN** existe config.py con lectura de variables de entorno

#### Scenario: Database config existe
- **GIVEN** el directorio app/core/
- **WHEN** se listan archivos
- **THEN** existe database.py con engine y session factory

#### Scenario: Security config existe
- **GIVEN** el directorio app/core/
- **WHEN** se listan archivos
- **THEN** existe security.py con funciones de hashing y JWT
