# Spec: infrastructure-patterns

## Overview
Define los patrones de infraestructura del backend: BaseRepository genérico y Unit of Work.

## ADDED Requirements

### Requirement: BaseRepository[T] genérico
El sistema DEBE tener un BaseRepository que proporcione operaciones CRUD comunes.

**Scenarios:**

#### Scenario: get_by_id retorna registro
- **GIVEN** un registro existente en la base de datos
- **WHEN** se llama repository.get_by_id(id)
- **THEN** retorna el objeto con ese ID

#### Scenario: get_by_id retorna None si no existe
- **GIVEN** un ID que no existe
- **WHEN** se llama repository.get_by_id(id)
- **THEN** retorna None

#### Scenario: list_all retorna registros paginados
- **GIVEN** múltiples registros
- **WHEN** se llama repository.list_all(skip=0, limit=10)
- **THEN** retorna hasta 10 registros

#### Scenario: list_all excluye eliminados por defecto
- **GIVEN** registros con eliminado_en no nulo
- **WHEN** se llama repository.list_all()
- **THEN** no incluye registros eliminados

#### Scenario: create retorna objeto con ID
- **GIVEN** un objeto a crear
- **WHEN** se llama repository.create(obj)
- **THEN** retorna el objeto con ID generado

#### Scenario: update modifica campos
- **GIVEN** un registro existente
- **WHEN** se llama repository.update(id, {campo: valor})
- **THEN** el campo se actualiza y retorna el objeto modificado

#### Scenario: soft_delete marca como eliminado
- **GIVEN** un registro existente
- **WHEN** se llama repository.soft_delete(id)
- **THEN** se establece eliminado_en con timestamp actual

#### Scenario: hard_delete elimina físicamente
- **GIVEN** un registro existente
- **WHEN** se llama repository.hard_delete(id)
- **THEN** el registro se elimina de la base de datos

### Requirement: Unit of Work
El sistema DEBE tener un UnitOfWork que agrupe operaciones en una transacción.

**Scarios:**

#### Scenario: UoW crea sesión al entrar
- **WHEN** se entra al context manager
- **THEN** se crea una sesión de base de datos

#### Scenario: UoW expone repositorios
- **WHEN** se usa uow.productos
- **THEN** retorna el repositorio de productos

#### Scenario: UoW hace commit al salir exitosamente
- **GIVEN** operaciones completadas
- **WHEN** se sale del context manager sin error
- **THEN** se ejecutan los cambios en la base de datos

#### Scenario: UoW hace rollback en error
- **GIVEN** una excepción dentro del context manager
- **WHEN** se sale del context manager
- **THEN** se deshacen todos los cambios