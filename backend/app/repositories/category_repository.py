"""
Category Repository - Data access layer for hierarchical categories
"""
from typing import Optional, List
from datetime import datetime
from sqlmodel import Session, select, text
from sqlalchemy import and_, or_

from app.models.catalogo import Categoria, ProductoCategoria
from app.repositories.base import BaseRepository


class CategoryRepository(BaseRepository[Categoria]):
    """Repository for Category model with hierarchical query support"""
    
    def __init__(self, session: Session):
        super().__init__(Categoria, session)
    
    def get_hierarchy(self) -> List[dict]:
        """
        Get complete category hierarchy using PostgreSQL CTE recursive query.
        Returns nested tree structure suitable for frontend consumption.
        
        Returns:
            List[dict]: Flat list of categories with niveau (depth level)
            
        Example:
            [
                {"id": 1, "nombre": "Fruits", "padre_id": None, "nivel": 0},
                {"id": 2, "nombre": "Citrus", "padre_id": 1, "nivel": 1},
            ]
        """
        query_text = """
            WITH RECURSIVE categorias_tree AS (
                SELECT id, nombre, padre_id, 0 as nivel
                FROM categorias
                WHERE padre_id IS NULL AND eliminado_en IS NULL
                
                UNION ALL
                
                SELECT c.id, c.nombre, c.padre_id, ct.nivel + 1
                FROM categorias c
                JOIN categorias_tree ct ON c.padre_id = ct.id
                WHERE c.eliminado_en IS NULL
            )
            SELECT id, nombre, padre_id, nivel
            FROM categorias_tree
            ORDER BY padre_id, nombre
        """
        
        result = self.session.exec(text(query_text)).all()
        return [
            {
                "id": row[0],
                "nombre": row[1],
                "padre_id": row[2],
                "nivel": row[3]
            }
            for row in result
        ]
    
    def validate_no_cycles(
        self, 
        category_id: int, 
        proposed_parent_id: Optional[int]
    ) -> bool:
        """
        Validate that assigning proposed_parent_id to category_id would not create a cycle.
        
        A cycle exists if proposed_parent_id is a descendant of category_id.
        Special cases:
        - If proposed_parent_id is None (making it root), always safe (return True)
        - If proposed_parent_id == category_id, self-reference (return False)
        
        Args:
            category_id: ID of category being updated
            proposed_parent_id: Proposed parent ID
            
        Returns:
            bool: True if assignment is safe (no cycle), False if it would create a cycle
        """
        # Moving to root is always safe
        if proposed_parent_id is None:
            return True
        
        # Self-reference not allowed
        if category_id == proposed_parent_id:
            return False
        
        # Check if proposed_parent_id is in descendants of category_id
        # If yes, it would create a cycle
        query_text = """
            WITH RECURSIVE descendants AS (
                SELECT id
                FROM categorias
                WHERE id = :category_id
                
                UNION ALL
                
                SELECT c.id
                FROM categorias c
                JOIN descendants d ON c.padre_id = d.id
            )
            SELECT COUNT(*) FROM descendants WHERE id = :proposed_parent_id
        """
        
        result = self.session.exec(
            text(query_text),
            {"category_id": category_id, "proposed_parent_id": proposed_parent_id}
        ).one()
        
        # If proposed_parent_id is in descendants of category_id, it's a cycle
        return result == 0
    
    def check_has_products(self, category_id: int) -> bool:
        """
        Check if category or any of its descendants have active (non-deleted) products.
        
        Args:
            category_id: ID of category to check
            
        Returns:
            bool: True if category or descendants have products, False otherwise
        """
        query_text = """
            WITH RECURSIVE category_tree AS (
                SELECT id
                FROM categorias
                WHERE id = :category_id
                
                UNION ALL
                
                SELECT c.id
                FROM categorias c
                JOIN category_tree ct ON c.padre_id = ct.id
            )
            SELECT COUNT(DISTINCT pc.id)
            FROM productos_categorias pc
            JOIN category_tree ct ON pc.categoria_id = ct.id
            JOIN productos p ON pc.producto_id = p.id
            WHERE p.eliminado_en IS NULL
        """
        
        result = self.session.exec(
            text(query_text),
            {"category_id": category_id}
        ).one()
        
        return result > 0
    
    def list_by_parent(
        self, 
        parent_id: Optional[int] = None,
        include_deleted: bool = False
    ) -> List[Categoria]:
        """
        List categories that have the given parent_id.
        
        Args:
            parent_id: Parent ID to filter by (None for root categories)
            include_deleted: Whether to include soft-deleted categories
            
        Returns:
            List[Categoria]: List of matching categories
        """
        query = select(self.model).where(self.model.padre_id == parent_id)
        
        if not include_deleted:
            query = query.where(self.model.eliminado_en == None)
        
        query = query.order_by(self.model.nombre)
        return list(self.session.exec(query).all())
    
    def get_descendants(self, category_id: int) -> List[int]:
        """
        Get IDs of all descendants of a category (recursive).
        
        Args:
            category_id: ID of parent category
            
        Returns:
            List[int]: List of descendant category IDs (includes the category itself)
        """
        query_text = """
            WITH RECURSIVE descendants AS (
                SELECT id
                FROM categorias
                WHERE id = :category_id
                
                UNION ALL
                
                SELECT c.id
                FROM categorias c
                JOIN descendants d ON c.padre_id = d.id
            )
            SELECT id FROM descendants
        """
        
        result = self.session.exec(
            text(query_text),
            {"category_id": category_id}
        ).all()
        
        return [row[0] if isinstance(row, tuple) else row for row in result]
    
    def get_parent_hierarchy(self, category_id: int) -> List[Categoria]:
        """
        Get the full hierarchy path from root to this category.
        
        Args:
            category_id: ID of category
            
        Returns:
            List[Categoria]: List of categories from root to target, ordered
        """
        query_text = """
            WITH RECURSIVE ancestors AS (
                SELECT id, nombre, padre_id, 0 as depth
                FROM categorias
                WHERE id = :category_id
                
                UNION ALL
                
                SELECT c.id, c.nombre, c.padre_id, a.depth + 1
                FROM categorias c
                JOIN ancestors a ON a.padre_id = c.id
            )
            SELECT * FROM ancestors ORDER BY depth DESC
        """
        
        result = self.session.exec(
            text(query_text),
            {"category_id": category_id}
        ).all()
        
        # Convert results to Categoria objects
        # This is a simplified approach; in production consider using ORM properly
        categories = []
        for row in result:
            cat = self.get_by_id(row[0], include_deleted=True)
            if cat:
                categories.append(cat)
        
        return categories
