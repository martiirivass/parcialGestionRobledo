# Spec: seed-data

## Overview
Define los datos iniciales que deben cargarse en la base de datos para que el sistema funcione: Roles, Estados de Pedido, Formas de Pago y usuario Administrador.

## ADDED Requirements

### Requirement: Seed de Roles
El sistema DEBE cargar los 4 roles fijos con IDs estables.

**Scenarios:**

#### Scenario: Roles iniciales
- **GIVEN** la base de datos vacía
- **WHEN** se ejecuta el script de seed
- **THEN** se insertan: ADMIN (id=1), STOCK (id=2), PEDIDOS (id=3), CLIENT (id=4)

#### Scenario: IDs estables
- **GIVEN** los roles en la base de datos
- **WHEN** se consultan
- **THEN** los IDs son exactamente: 1, 2, 3, 4

### Requirement: Seed de Estados de Pedido
El sistema DEBE cargar los 6 estados del FSM de pedidos.

**Scenarios:**

#### Scenario: Estados de pedido iniciales
- **GIVEN** la base de datos vacía
- **WHEN** se ejecuta el script de seed
- **THEN** se insertan: PENDIENTE (id=1), CONFIRMADO (id=2), EN_PREPARACION (id=3), EN_CAMINO (id=4), ENTREGADO (id=5), CANCELADO (id=6)

### Requirement: Seed de Formas de Pago
El sistema DEBE cargar las formas de pago aceptadas.

**Scenarios:**

#### Scenario: Formas de pago iniciales
- **GIVEN** la base de datos vacía
- **WHEN** se ejecuta el script de seed
- **THEN** se insertan: Tarjeta de crédito, Tarjeta de débito (ambos activos)

### Requirement: Usuario Administrador
El sistema DEBE crear un usuario administrador inicial.

**Scenarios:**

#### Scenario: Usuario admin existe
- **GIVEN** la base de datos vacía
- **WHEN** se ejecuta el script de seed
- **THEN** se crea un usuario con rol ADMIN, email configurable por variable de entorno

### Requirement: Seed idempotente
El script de seed DEBE ser idempotente.

**Scenarios:**

#### Scenario: Ejecución múltiple no duplica datos
- **GIVEN** el seed ya ejecutado
- **WHEN** se ejecuta nuevamente
- **THEN** no se crean registros duplicados

#### Scenario: Ejecución múltiple no genera errores
- **GIVEN** el seed ya ejecutado
- **WHEN** se ejecuta nuevamente
- **THEN** el script se completa sin errores