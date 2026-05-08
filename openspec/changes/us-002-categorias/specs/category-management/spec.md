## ADDED Requirements

### Requirement: Category Creation by Stock Manager
Stock managers and admins SHALL be able to create new product categories with a name and optional parent category. The system SHALL validate that the parent category exists and does not create a cycle in the hierarchy. The new category SHALL be assigned a unique ID and stored with a creation timestamp.

#### Scenario: Create root category
- **WHEN** a stock manager submits a category creation request with name "Fruits" and no parent
- **THEN** the system creates a category with that name at the root level (parentId = NULL)
- **THEN** the response includes id, nombre, parentId, createdAt, updatedAt

#### Scenario: Create subcategory
- **WHEN** a stock manager submits a category creation request with name "Citrus" and parentId pointing to "Fruits"
- **THEN** the system creates a category with that name as child of "Fruits"
- **THEN** the response includes the parent relationship

#### Scenario: Duplicate name rejection
- **WHEN** a stock manager tries to create a category with the same name under the same parent
- **THEN** the system rejects the request with HTTP 409 Conflict
- **THEN** error message indicates "Category with this name already exists in this parent"

#### Scenario: Invalid parent rejection
- **WHEN** a stock manager tries to create a category with a non-existent parentId
- **THEN** the system rejects the request with HTTP 404 Not Found

#### Scenario: Authorization check
- **WHEN** a CLIENT user tries to create a category
- **THEN** the system rejects with HTTP 403 Forbidden

### Requirement: Category Update with Hierarchy Validation
Stock managers and admins SHALL be able to update category name and parent. The system SHALL prevent creating cycles (A parent of B, B parent of A). The system SHALL prevent self-reference. All changes SHALL be recorded with an updatedAt timestamp.

#### Scenario: Update category name
- **WHEN** a stock manager updates category "Fruits" name to "Fresh Fruits"
- **THEN** the system persists the name change
- **THEN** updatedAt is refreshed to current timestamp

#### Scenario: Reparent category
- **WHEN** a stock manager moves category "Citrus" from parent "Fruits" to parent "Citrus Fruits"
- **THEN** the system updates the parentId relationship

#### Scenario: Cycle prevention
- **WHEN** a stock manager tries to set "Fruits" as parent of "Citrus" (which already is parent of "Fruits")
- **THEN** the system rejects with HTTP 400 Bad Request
- **THEN** error message indicates "Cannot create cycle: Citrus -> Fruits -> Citrus"

#### Scenario: Self-reference prevention
- **WHEN** a stock manager tries to set a category as its own parent
- **THEN** the system rejects with HTTP 400 Bad Request

### Requirement: Category Soft Delete with Integrity Check
Stock managers and admins SHALL be able to delete categories. Deleted categories SHALL be marked with a deletedAt timestamp (soft delete). The system SHALL prevent deletion of categories that have active products directly or in descendant categories. Stock managers SHALL not be able to see deleted categories in normal list operations.

#### Scenario: Delete empty category
- **WHEN** a stock manager deletes category "Dairy" that has no products
- **THEN** the system marks deletedAt with current timestamp
- **THEN** the category stops appearing in public category lists

#### Scenario: Reject deletion with products
- **WHEN** a stock manager tries to delete "Fruits" which has active products
- **THEN** the system rejects with HTTP 409 Conflict
- **THEN** error message indicates "Cannot delete category with active products. Please reassign or delete products first."

#### Scenario: Include deleted in admin view
- **WHEN** an admin queries categories with includeDeleted=true parameter
- **THEN** deleted categories are included in response with deletedAt timestamp visible

### Requirement: Category Retrieval by ID
The system SHALL provide an endpoint to retrieve a single category by ID for admin review. The response SHALL include category name, parent relationship, timestamps, and soft delete status.

#### Scenario: Get existing category
- **WHEN** an admin queries GET /api/v1/categorias/123
- **THEN** the system returns { id: "123", nombre: "Fruits", parentId: null, createdAt: "...", updatedAt: "...", deletedAt: null }

#### Scenario: Get non-existent category
- **WHEN** an admin queries a non-existent category ID
- **THEN** the system returns HTTP 404 Not Found

#### Scenario: Authorization for admin view
- **WHEN** a CLIENT queries admin category view
- **THEN** the system returns HTTP 403 Forbidden

## MODIFIED Requirements

### Requirement: Role-Based Access Control
The existing RBAC system SHALL be extended to protect category management endpoints. POST /api/v1/categorias, PUT /api/v1/categorias/:id, and DELETE /api/v1/categorias/:id SHALL require either ADMIN or STOCK role. GET /api/v1/categorias (tree view) SHALL remain public and require no authentication.

#### Scenario: Require ADMIN or STOCK for create
- **WHEN** a user with PEDIDOS role tries POST /api/v1/categorias
- **THEN** the system returns HTTP 403 Forbidden

#### Scenario: Public category listing
- **WHEN** an unauthenticated client requests GET /api/v1/categorias
- **THEN** the system returns the complete category tree
- **THEN** no authentication header is required
