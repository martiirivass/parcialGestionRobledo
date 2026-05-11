## ADDED Requirements

### Requirement: Public Category Tree Retrieval
The system SHALL provide a public endpoint that returns the complete category hierarchy as a nested tree structure. The response SHALL include all categories organized by parent-child relationships. Deleted categories SHALL be automatically filtered out. The response SHALL be optimized for client-side navigation.

#### Scenario: Get complete category tree
- **WHEN** a client sends GET /api/v1/categorias
- **THEN** the system returns a JSON array of root categories with nested subcategorias
- **THEN** each category includes: id, nombre, subcategorias (array, recursive)
- **THEN** the response is publicly accessible (no authentication required)

#### Scenario: Tree includes all nesting levels
- **WHEN** the database contains categories: Fruits (root) → Citrus → Oranges
- **THEN** the response includes Fruits with subcategorias containing Citrus, and Citrus with subcategorias containing Oranges

#### Scenario: Deleted categories excluded
- **WHEN** the database contains category "OldDairy" marked with deletedAt
- **THEN** the response does NOT include "OldDairy" anywhere in the tree
- **THEN** its children (if not deleted) are NOT orphaned; they should be displayed correctly

#### Scenario: Empty tree handling
- **WHEN** the database has no categories
- **THEN** the system returns an empty array []

#### Scenario: Deep nesting retrieval
- **WHEN** the database contains a deep tree (A → B → C → D → E)
- **THEN** the system successfully retrieves and returns all levels without truncation or depth limit

### Requirement: Category Data Format for Navigation
The category tree response SHALL use a consistent JSON schema that allows clients to recursively render category hierarchies. Each category object SHALL include essential identifiers and hierarchical pointers.

#### Scenario: Response schema consistency
- **WHEN** a client parses GET /api/v1/categorias response
- **THEN** each category object has structure: { id: string, nombre: string, subcategorias: Category[] }
- **THEN** leaf categories have empty subcategorias array []

#### Scenario: Frontend can recursively render
- **WHEN** a frontend component receives the category tree
- **THEN** it can recursively render nested categories without additional API calls
- **THEN** no parentId is required in response (tree structure implies hierarchy)

### Requirement: Public Access Without Authentication
The category listing endpoint SHALL not require authentication headers or tokens. Any client (authenticated or not) SHALL receive the same category tree. Rate limiting MAY be applied separately but SHALL NOT prevent access for clients with no token.

#### Scenario: Unauthenticated access
- **WHEN** a client sends GET /api/v1/categorias with no Authorization header
- **THEN** the system returns HTTP 200 with complete category tree

#### Scenario: Authenticated access
- **WHEN** a client sends GET /api/v1/categorias with valid JWT token
- **THEN** the system returns HTTP 200 with complete category tree (same response as unauthenticated)

#### Scenario: Invalid token doesn't block browsing
- **WHEN** a client sends GET /api/v1/categorias with malformed Authorization header
- **THEN** the system ignores the header and returns HTTP 200 with category tree
- **THEN** no error is raised for the invalid token on this endpoint

### Requirement: Efficient Hierarchy Query
The system SHALL fetch the complete category tree in a single database query using recursive query techniques (PostgreSQL WITH RECURSIVE or equivalent). The response SHALL be returned in order suitable for client-side tree rendering.

#### Scenario: Single query execution
- **WHEN** a client requests GET /api/v1/categorias
- **THEN** the system executes exactly one database query (CTE recursive query)
- **THEN** no N+1 query problems occur regardless of category depth

#### Scenario: Ordering for tree rendering
- **WHEN** the system returns categories
- **THEN** categories are ordered hierarchically (root categories first, then children grouped by parent)
- **THEN** sibling categories maintain alphabetical order by nombre
