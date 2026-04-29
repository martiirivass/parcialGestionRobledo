# Spec: database-schema

## Overview
Define el esquema de base de datos PostgreSQL con los 16 modelos del ERD v5, migraciones Alembic y campos de auditoría.

## ADDED Requirements

### Requirement: Modelos SQLModel para todas las entidades
El sistema DEBE tener modelos SQLModel para las 16 entidades del ERD v5.

**Scenarios:**

#### Scenario: Dominio Identidad y Acceso
- **GIVEN** los modelos en app/models/
- **WHEN** se verifican
- **THEN** existen: Usuario, Rol, UsuarioRol, RefreshToken, DireccionEntrega

#### Scenario: Dominio Catálogo
- **GIVEN** los modelos en app/models/
- **WHEN** se verifican
- **THEN** existen: Categoria, Producto, Ingrediente, ProductoCategoria, ProductoIngrediente, FormaPago

#### Scenario: Dominio Ventas
- **GIVEN** los modelos en app/models/
- **WHEN** se verifican
- **THEN** existen: EstadoPedido, Pedido, DetallePedido, HistorialEstadoPedido, Pago

### Requirement: Campos de auditoría
Todas las tablas principales DEBEN tener campos de auditoría.

**Scenarios:**

#### Scenario: Campos de auditoría obligatorios
- **GIVEN** un modelo principal (Usuario, Producto, Pedido, etc.)
- **WHEN** se examina
- **THEN** tiene: creado_en (timestamp), actualizado_en (timestamp), eliminado_en (timestamp nullable)

### Requirement: Soft delete
Las entidades que soportan borrado lógico DEBEN tener campo eliminado_en.

**Scenarios:**

#### Scenario: Soft delete en tablas principales
- **GIVEN** tablas con soft delete
- **WHEN** se elimina un registro
- **THEN** no se borra físicamente, se establece eliminado_en

### Requirement: Relaciones entre entidades
Las relaciones entre entidades DEBEN estar correctamente modeladas.

**Scarios:**

#### Scenario: FK autoreferencial en Categoria
- **GIVEN** el modelo Categoria
- **WHEN** se examina
- **THEN** tiene padre_id como FK autoreferencial nullable

#### Scenario: FK compuesta única en UsuarioRol
- **GIVEN** el modelo UsuarioRol
- **WHEN** se examina
- **THEN** tiene restricción UNIQUE en (usuario_id, rol_id)

#### Scenario: Relaciones M:N
- **GIVEN** ProductoCategoria y ProductoIngrediente
- **WHEN** se examinan
- **THEN** implementan relaciones muchos-a-muchos

### Requirement: Migraciones Alembic
El sistema DEBE tener migraciones Alembic configuradas.

**Scenarios:**

#### Scenario: Alembic configurado
- **GIVEN** el directorio alembic/
- **WHEN** se verifica
- **THEN** existe alembic.ini y estructura de versiones

#### Scenario: Migración inicial genera todas las tablas
- **GIVEN** BD vacía
- **WHEN** se ejecuta alembic upgrade head
- **THEN** se crean las 16 tablas sin errores

#### Scenario: Migración es reversible
- **GIVEN** migraciones aplicadas
- **WHEN** se ejecuta alembic downgrade -1
- **THEN** la última migración se revierte sin errores
## Requirements
### Requirement: Modelos SQLModel para todas las entidades
El sistema DEBE tener modelos SQLModel para las 16 entidades del ERD v5.

**Scenarios:**

#### Scenario: Dominio Identidad y Acceso
- **GIVEN** los modelos en app/models/
- **WHEN** se verifican
- **THEN** existen: Usuario, Rol, UsuarioRol, RefreshToken, DireccionEntrega

#### Scenario: Dominio Catálogo
- **GIVEN** los modelos en app/models/
- **WHEN** se verifican
- **THEN** existen: Categoria, Producto, Ingrediente, ProductoCategoria, ProductoIngrediente, FormaPago

#### Scenario: Dominio Ventas
- **GIVEN** los modelos en app/models/
- **WHEN** se verifican
- **THEN** existen: EstadoPedido, Pedido, DetallePedido, HistorialEstadoPedido, Pago

### Requirement: Campos de auditoría
Todas las tablas principales DEBEN tener campos de auditoría.

**Scenarios:**

#### Scenario: Campos de auditoría obligatorios
- **GIVEN** un modelo principal (Usuario, Producto, Pedido, etc.)
- **WHEN** se examina
- **THEN** tiene: creado_en (timestamp), actualizado_en (timestamp), eliminado_en (timestamp nullable)

### Requirement: Soft delete
Las entidades que soportan borrado lógico DEBEN tener campo eliminado_en.

**Scenarios:**

#### Scenario: Soft delete en tablas principales
- **GIVEN** tablas con soft delete
- **WHEN** se elimina un registro
- **THEN** no se borra físicamente, se establece eliminado_en

### Requirement: Relaciones entre entidades
Las relaciones entre entidades DEBEN estar correctamente modeladas.

**Scarios:**

#### Scenario: FK autoreferencial en Categoria
- **GIVEN** el modelo Categoria
- **WHEN** se examina
- **THEN** tiene padre_id como FK autoreferencial nullable

#### Scenario: FK compuesta única en UsuarioRol
- **GIVEN** el modelo UsuarioRol
- **WHEN** se examina
- **THEN** tiene restricción UNIQUE en (usuario_id, rol_id)

#### Scenario: Relaciones M:N
- **GIVEN** ProductoCategoria y ProductoIngrediente
- **WHEN** se examinan
- **THEN** implementan relaciones muchos-a-muchos

### Requirement: Migraciones Alembic
El sistema DEBE tener migraciones Alembic configuradas.

**Scenarios:**

#### Scenario: Alembic configurado
- **GIVEN** el directorio alembic/
- **WHEN** se verifica
- **THEN** existe alembic.ini y estructura de versiones

#### Scenario: Migración inicial genera todas las tablas
- **GIVEN** BD vacía
- **WHEN** se ejecuta alembic upgrade head
- **THEN** se crean las 16 tablas sin errores

#### Scenario: Migración es reversible
- **GIVEN** migraciones aplicadas
- **WHEN** se ejecuta alembic downgrade -1
- **THEN** la última migración se revierte sin errores

