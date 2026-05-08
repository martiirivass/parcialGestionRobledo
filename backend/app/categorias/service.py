"""
Category Service - Business logic for hierarchical categories
"""
from datetime import datetime
from typing import Optional, List
from sqlmodel import Session

from app.models.catalogo import Categoria
from app.repositories.category_repository import CategoryRepository


class CategoryService:
    """Service layer for category operations with validation and cycle detection"""
    
    def __init__(self, session: Session):
        self.session = session
        self.repo = CategoryRepository(session)
    
    def create_category(
        self,
        nombre: str,
        parent_id: Optional[int] = None
    ) -> Categoria:
        """
        Create a new category with validation.
        
        Validates:
        - Parent category exists (if provided)
        - No cycles would be created
        - Unique nombre per parent
        
        Args:
            nombre: Category name (max 100 chars)
            parent_id: Parent category ID (optional)
            
        Returns:
            Categoria: Created category
            
        Raises:
            ValueError: If validation fails
        """
        # Validate parent exists if provided
        if parent_id is not None:
            parent = self.repo.get_by_id(parent_id, include_deleted=False)
            if not parent:
                raise ValueError(f"Parent category with id {parent_id} not found")
        
        # Check for duplicate nombre in same parent
        existing = self.repo.list_by_parent(parent_id, include_deleted=False)
        if any(cat.nombre.lower() == nombre.lower() for cat in existing):
            raise ValueError(f"Category '{nombre}' already exists under this parent")
        
        # Create category
        nueva_categoria = Categoria(
            nombre=nombre,
            padre_id=parent_id,
            creado_en=datetime.utcnow(),
            actualizado_en=datetime.utcnow()
        )
        
        self.session.add(nueva_categoria)
        self.session.flush()
        self.session.refresh(nueva_categoria)
        
        return nueva_categoria
    
    def update_category(
        self,
        category_id: int,
        nombre: Optional[str] = None,
        parent_id: Optional[int] = None
    ) -> Categoria:
        """
        Update a category with validation.
        
        Validates:
        - Category exists
        - New parent exists (if provided)
        - No cycles would be created
        - Unique nombre per parent (if changed)
        
        Args:
            category_id: ID of category to update
            nombre: New name (optional)
            parent_id: New parent ID (optional) - if not provided, keeps current
            
        Returns:
            Categoria: Updated category
            
        Raises:
            ValueError: If validation fails
        """
        category = self.repo.get_by_id(category_id, include_deleted=False)
        if not category:
            raise ValueError(f"Category with id {category_id} not found")
        
        # If parent_id is provided, validate it
        if parent_id is not None:
            # Validate parent exists
            if parent_id != category.padre_id:  # Only check if actually changing
                parent = self.repo.get_by_id(parent_id, include_deleted=False)
                if not parent:
                    raise ValueError(f"Parent category with id {parent_id} not found")
                
                # Check for cycles
                if not self.repo.validate_no_cycles(category_id, parent_id):
                    raise ValueError(
                        f"Cannot set parent {parent_id} for category {category_id}: "
                        "would create a cycle"
                    )
        
        # If nombre is provided, check for duplicates in target parent
        if nombre is not None:
            target_parent = parent_id if parent_id is not None else category.padre_id
            existing = self.repo.list_by_parent(target_parent, include_deleted=False)
            if any(
                cat.nombre.lower() == nombre.lower() and cat.id != category_id
                for cat in existing
            ):
                raise ValueError(f"Category '{nombre}' already exists under this parent")
        
        # Update fields
        if nombre is not None:
            category.nombre = nombre
        if parent_id is not None:
            category.padre_id = parent_id
        
        category.actualizado_en = datetime.utcnow()
        
        self.session.add(category)
        self.session.flush()
        self.session.refresh(category)
        
        return category
    
    def delete_category(self, category_id: int) -> Categoria:
        """
        Soft delete a category (mark as deleted).
        
        Validates:
        - Category exists
        - No active products in category or descendants
        
        Args:
            category_id: ID of category to delete
            
        Returns:
            Categoria: Deleted category (with eliminado_en timestamp)
            
        Raises:
            ValueError: If validation fails
        """
        category = self.repo.get_by_id(category_id, include_deleted=False)
        if not category:
            raise ValueError(f"Category with id {category_id} not found")
        
        # Check if category or descendants have products
        if self.repo.check_has_products(category_id):
            raise ValueError(
                f"Cannot delete category {category_id}: "
                "it or its descendants have active products"
            )
        
        # Soft delete
        category.eliminado_en = datetime.utcnow()
        category.actualizado_en = datetime.utcnow()
        
        self.session.add(category)
        self.session.flush()
        self.session.refresh(category)
        
        return category
    
    def get_category_by_id(
        self,
        category_id: int,
        include_deleted: bool = False
    ) -> Optional[Categoria]:
        """
        Get a category by ID.
        
        Args:
            category_id: ID of category
            include_deleted: Include soft-deleted categories
            
        Returns:
            Categoria or None if not found
        """
        return self.repo.get_by_id(category_id, include_deleted=include_deleted)
    
    def get_category_tree(self) -> List[dict]:
        """
        Get complete category hierarchy as nested tree structure.
        
        Only includes non-deleted categories.
        
        Returns:
            List[dict]: Nested tree where each node has:
                - id: category ID
                - nombre: category name
                - padre_id: parent ID (or null for root)
                - subcategorias: List of child categories (recursive)
        """
        flat_hierarchy = self.repo.get_hierarchy()
        
        # Build nested structure
        def build_tree(parent_id=None):
            children = []
            for item in flat_hierarchy:
                if item["padre_id"] == parent_id:
                    child = {
                        "id": item["id"],
                        "nombre": item["nombre"],
                        "padre_id": item["padre_id"],
                        "subcategorias": build_tree(item["id"])
                    }
                    children.append(child)
            return children
        
        # Return root-level categories (padre_id is None)
        return build_tree(None)
    
    def get_list_all_categories(self, include_deleted: bool = False) -> List[Categoria]:
        """
        Get flat list of all categories.
        
        Args:
            include_deleted: Include soft-deleted categories
            
        Returns:
            List[Categoria]: All categories
        """
        return self.repo.list_all(include_deleted=include_deleted)
