# Spec: zustand-stores

## Overview
Define los cuatro stores de Zustand para gestión de estado del cliente: authStore, cartStore, paymentStore y uiStore.

## ADDED Requirements

### Requirement: authStore
El sistema DEBE tener un store para autenticación.

**Scenarios:**

#### Scenario: authStore tiene estado inicial
- **GIVEN** authStore
- **WHEN** se verifica estado inicial
- **THEN** tiene: accessToken null, refreshToken null, user null, isAuthenticated false

#### Scenario: login establece estado
- **GIVEN** credenciales válidas
- **WHEN** se llama login(tokens, user)
- **THEN** establece accessToken, refreshToken, user, isAuthenticated true

#### Scenario: logout limpia estado
- **GIVEN** usuario autenticado
- **WHEN** se llama logout()
- **THEN** establece accessToken null, refreshToken null, user null, isAuthenticated false

#### Scenario: updateTokens actualiza tokens
- **GIVEN** nuevos tokens
- **WHEN** se llama updateTokens(tokens)
- **THEN** actualiza accessToken y refreshToken

#### Scenario: isAuthenticated selector
- **GIVEN** estado
- **WHEN** se llama isAuthenticated()
- **THEN** retorna boolean

#### Scenario: hasRole selector
- **GIVEN** usuario con roles
- **WHEN** se llama hasRole("ADMIN")
- **THEN** retorna true si tiene el rol

### Requirement: cartStore
El sistema DEBE tener un store para el carrito de compras.

**Scenarios:**

#### Scenario: cartStore tiene estado inicial
- **GIVEN** cartStore
- **WHEN** se verifica estado inicial
- **THEN** tiene: items []

#### Scenario: addItem agrega producto
- **GIVEN** carrito vacío
- **WHEN** se llama addItem(producto, cantidad, personalizacion)
- **THEN** items tiene 1 elemento

#### Scenario: removeItem elimina producto
- **GIVEN** carrito con items
- **WHEN** se llama removeItem(productoId)
- **THEN** producto removido del array

#### Scenario: updateQuantity modifica cantidad
- **GIVEN** item en carrito
- **WHEN** se llama updateQuantity(productoId, cantidad)
- **THEN** cantidad actualizada

#### Scenario: clearCart vacía array
- **GIVEN** carrito con items
- **WHEN** se llama clearCart()
- **THEN** items = []

#### Scenario: Persistencia en localStorage
- **GIVEN** items en store
- **WHEN** se refresca página
- **THEN** items persisten

### Requirement: paymentStore
El sistema DEBE tener un store para el proceso de pago.

**Scenarios:**

#### Scenario: paymentStore tiene estado inicial
- **GIVEN** paymentStore
- **WHEN** se verifica estado inicial
- **THEN** tiene: preferencia null, status "idle", error null

#### Scenario: setPreferencia establece preferencia
- **GIVEN** preferencia de MercadoPago
- **WHEN** se llama setPreferencia(preferencia)
- **THEN** preferencia configurada, status "ready"

#### Scenario: setStatus cambia estado
- **GIVEN** proceso de pago
- **WHEN** se llama setStatus("processing")
- **THEN** status actualizado

### Requirement: uiStore
El sistema DEBE tener un store para estado de la interfaz.

**Scenarios:**

#### Scenario: uiStore tiene estado inicial
- **GIVEN** uiStore
- **WHEN** se verifica estado inicial
- **THEN** tiene: theme "light", sidebarOpen false, notifications []

#### Scenario: toggleTheme cambia tema
- **GIVEN** theme "light"
- **WHEN** se llama toggleTheme()
- **THEN** theme = "dark"

#### Scenario: toggleSidebar abre/cierra
- **GIVEN** sidebarOpen false
- **WHEN** se llama toggleSidebar()
- **THEN** sidebarOpen true

#### Scenario: addNotification muestra notificación
- **GIVEN** uiStore
- **WHEN** se llama addNotification(message, type)
- **THEN** notification agregada al array
## Requirements
### Requirement: authStore
El sistema DEBE tener un store para autenticación.

**Scenarios:**

#### Scenario: authStore tiene estado inicial
- **GIVEN** authStore
- **WHEN** se verifica estado inicial
- **THEN** tiene: accessToken null, refreshToken null, user null, isAuthenticated false

#### Scenario: login establece estado
- **GIVEN** credenciales válidas
- **WHEN** se llama login(tokens, user)
- **THEN** establece accessToken, refreshToken, user, isAuthenticated true

#### Scenario: logout limpia estado
- **GIVEN** usuario autenticado
- **WHEN** se llama logout()
- **THEN** establece accessToken null, refreshToken null, user null, isAuthenticated false

#### Scenario: updateTokens actualiza tokens
- **GIVEN** nuevos tokens
- **WHEN** se llama updateTokens(tokens)
- **THEN** actualiza accessToken y refreshToken

#### Scenario: isAuthenticated selector
- **GIVEN** estado
- **WHEN** se llama isAuthenticated()
- **THEN** retorna boolean

#### Scenario: hasRole selector
- **GIVEN** usuario con roles
- **WHEN** se llama hasRole("ADMIN")
- **THEN** retorna true si tiene el rol

### Requirement: cartStore
El sistema DEBE tener un store para el carrito de compras.

**Scenarios:**

#### Scenario: cartStore tiene estado inicial
- **GIVEN** cartStore
- **WHEN** se verifica estado inicial
- **THEN** tiene: items []

#### Scenario: addItem agrega producto
- **GIVEN** carrito vacío
- **WHEN** se llama addItem(producto, cantidad, personalizacion)
- **THEN** items tiene 1 elemento

#### Scenario: removeItem elimina producto
- **GIVEN** carrito con items
- **WHEN** se llama removeItem(productoId)
- **THEN** producto removido del array

#### Scenario: updateQuantity modifica cantidad
- **GIVEN** item en carrito
- **WHEN** se llama updateQuantity(productoId, cantidad)
- **THEN** cantidad actualizada

#### Scenario: clearCart vacía array
- **GIVEN** carrito con items
- **WHEN** se llama clearCart()
- **THEN** items = []

#### Scenario: Persistencia en localStorage
- **GIVEN** items en store
- **WHEN** se refresca página
- **THEN** items persisten

### Requirement: paymentStore
El sistema DEBE tener un store para el proceso de pago.

**Scenarios:**

#### Scenario: paymentStore tiene estado inicial
- **GIVEN** paymentStore
- **WHEN** se verifica estado inicial
- **THEN** tiene: preferencia null, status "idle", error null

#### Scenario: setPreferencia establece preferencia
- **GIVEN** preferencia de MercadoPago
- **WHEN** se llama setPreferencia(preferencia)
- **THEN** preferencia configurada, status "ready"

#### Scenario: setStatus cambia estado
- **GIVEN** proceso de pago
- **WHEN** se llama setStatus("processing")
- **THEN** status actualizado

### Requirement: uiStore
El sistema DEBE tener un store para estado de la interfaz.

**Scenarios:**

#### Scenario: uiStore tiene estado inicial
- **GIVEN** uiStore
- **WHEN** se verifica estado inicial
- **THEN** tiene: theme "light", sidebarOpen false, notifications []

#### Scenario: toggleTheme cambia tema
- **GIVEN** theme "light"
- **WHEN** se llama toggleTheme()
- **THEN** theme = "dark"

#### Scenario: toggleSidebar abre/cierra
- **GIVEN** sidebarOpen false
- **WHEN** se llama toggleSidebar()
- **THEN** sidebarOpen true

#### Scenario: addNotification muestra notificación
- **GIVEN** uiStore
- **WHEN** se llama addNotification(message, type)
- **THEN** notification agregada al array

