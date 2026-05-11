"""
Product Service - Business logic for product management
"""
from datetime import datetime
from typing import Optional, List, Tuple
from decimal import Decimal
from sqlmodel import Session, select

from app.models.catalogo import Producto, Categoria, Ingrediente
from app.repositories.product_repository import ProductRepository


class ProductService:
    """Service layer for product operations with validation"""
    
    def __init__(self, session: Session):
        self.session = session
        self.repo = ProductRepository(session)
    
    def create_product(
        self,
        nombre: str,
        descripcion: Optional[str],
        precio: Decimal,
        stock: int,
        imagen_url: Optional[str],
        disponible: bool,
        categorias_ids: Optional[List[int]] = None,
        ingredientes_ids: Optional[List[int]] = None
    ) -> Producto:
        """
        Create a new product with validation.
        
        Validates:
        - Price > 0
        - Stock >= 0
        - Name 3-255 characters
        - All categoria_ids exist
        - All ingrediente_ids exist
        
        Args:
            nombre: Product name (3-255 chars)
            descripcion: Product description (optional)
            precio: Product price (Decimal > 0)
            stock: Initial stock (>= 0)
            imagen_url: Product image URL (optional)
            disponible: Availability flag
            categorias_ids: List of category IDs (optional)
            ingredientes_ids: List of ingredient IDs (optional)
            
        Returns:
            Producto: Created product
            
        Raises:
            ValueError: If validation fails
        """
        # Validate nombre
        if not nombre or len(nombre) < 3 or len(nombre) > 255:
            raise ValueError("Nombre must be between 3 and 255 characters")
        
        # Validate precio
        if precio <= 0:
            raise ValueError("Precio must be greater than 0")
        
        # Validate stock
        if stock < 0:
            raise ValueError("Stock must be greater than or equal to 0")
        
        # Validate categories exist
        if categorias_ids:
            for cat_id in categorias_ids:
                cat = self.session.exec(
                    select(Categoria).where(
                        Categoria.id == cat_id,
                        Categoria.eliminado_en == None
                    )
                ).first()
                if not cat:
                    raise ValueError(f"Categoria with id {cat_id} not found or is deleted")
        
        # Validate ingredients exist
        if ingredientes_ids:
            for ing_id in ingredientes_ids:
                ing = self.session.exec(
                    select(Ingrediente).where(Ingrediente.id == ing_id)
                ).first()
                if not ing:
                    raise ValueError(f"Ingrediente with id {ing_id} not found")
         
         # Create product
        producto = self.repo.create_with_associations(
            nombre=nombre,
            descripcion=descripcion,
            precio=precio,
            stock=stock,
            imagen_url=imagen_url,
            disponible=disponible,
            categorias_ids=categorias_ids,
            ingredientes_ids=ingredientes_ids
        )
        
        return producto
    
    def get_product(
        self,
        id: int,
        admin: bool = False,
        include_deleted: bool = False
    ) -> Producto:
        """
        Get a product by ID.
        
        Args:
            id: Product ID
            admin: If True, use admin view (can see any product); if False, use public view (only available)
            include_deleted: If True and admin=True, include soft-deleted products
            
        Returns:
            Producto: Product
            
        Raises:
            ValueError: If product not found
        """
        if admin:
            producto = self.repo.get_by_id_admin(id, include_deleted=include_deleted)
        else:
            producto = self.repo.get_by_id_public(id)
        
        if not producto:
            raise ValueError(f"Producto with id {id} not found")
        
        return producto
    
    def list_products_public(
        self,
        skip: int = 0,
        limit: int = 100,
        categoria_id: Optional[int] = None,
        search: Optional[str] = None,
        excluir_alergenos: Optional[List[int]] = None
    ) -> Tuple[List[Producto], int]:
        """
        List public products with pagination and filtering.
        
        Args:
            skip: Pagination offset
            limit: Pagination limit
            categoria_id: Optional category ID to filter by
            search: Optional text to search in product name
            excluir_alergenos: Optional list of allergen ingredient IDs to exclude
            
        Returns:
            Tuple[List[Producto], int]: List of products and total count
        """
        productos = self.repo.get_all_public(
            skip=skip,
            limit=limit,
            categoria_id=categoria_id,
            search=search,
            excluir_alergenos=excluir_alergenos
        )
        
        total = self.repo.count_public(
            categoria_id=categoria_id,
            search=search,
            excluir_alergenos=excluir_alergenos
        )
        
        return productos, total
    
    def update_product(
        self,
        id: int,
        nombre: Optional[str] = None,
        descripcion: Optional[str] = None,
        precio: Optional[Decimal] = None,
        stock: Optional[int] = None,
        imagen_url: Optional[str] = None,
        disponible: Optional[bool] = None,
        categorias_ids: Optional[List[int]] = None,
        ingredientes_ids: Optional[List[int]] = None
    ) -> Producto:
        """
        Update a product with validation.
        
        Validates:
        - If provided, price > 0
        - If provided, stock >= 0
        - If provided, name 3-255 characters
        - All categoria_ids exist
        - All ingrediente_ids exist
        
        Args:
            id: Product ID
            nombre: New name (optional)
            descripcion: New description (optional)
            precio: New price (optional)
            stock: New stock (optional)
            imagen_url: New image URL (optional)
            disponible: New availability (optional)
            categorias_ids: New category IDs (optional)
            ingredientes_ids: New ingredient IDs (optional)
            
        Returns:
            Producto: Updated product
            
        Raises:
            ValueError: If validation fails or product not found
        """
        # Validate nombre if provided
        if nombre is not None and (len(nombre) < 3 or len(nombre) > 255):
            raise ValueError("Nombre must be between 3 and 255 characters")
        
        # Validate precio if provided
        if precio is not None and precio <= 0:
            raise ValueError("Precio must be greater than 0")
        
        # Validate stock if provided
        if stock is not None and stock < 0:
            raise ValueError("Stock must be greater than or equal to 0")
        
        # Validate categories exist
        if categorias_ids:
            for cat_id in categorias_ids:
                cat = self.session.exec(
                    select(Categoria).where(
                        Categoria.id == cat_id,
                        Categoria.eliminado_en == None
                    )
                ).first()
                if not cat:
                    raise ValueError(f"Categoria with id {cat_id} not found or is deleted")
        
        # Validate ingredients exist
        if ingredientes_ids:
            for ing_id in ingredientes_ids:
                ing = self.session.exec(
                    select(Ingrediente).where(Ingrediente.id == ing_id)
                ).first()
                if not ing:
                    raise ValueError(f"Ingrediente with id {ing_id} not found")
         
         # Update product
        producto = self.repo.update_with_associations(
            id=id,
            nombre=nombre,
            descripcion=descripcion,
            precio=precio,
            stock=stock,
            imagen_url=imagen_url,
            disponible=disponible,
            categorias_ids=categorias_ids,
            ingredientes_ids=ingredientes_ids
        )
        
        if not producto:
            raise ValueError(f"Producto with id {id} not found")
        
        return producto
    
    def delete_product(self, id: int) -> Producto:
        """
        Soft delete a product by setting eliminado_en timestamp.
        
        Args:
            id: Product ID
            
        Returns:
            Producto: Soft-deleted product
            
        Raises:
            ValueError: If product not found
        """
        producto = self.repo.soft_delete_product(id)
        if not producto:
            raise ValueError(f"Producto with id {id} not found")
        
        return producto
    
    def update_stock(self, id: int, cantidad: int) -> Producto:
        """
        Update product stock atomically.
        
        Args:
            id: Product ID
            cantidad: Quantity to change (positive to increase, negative to decrease)
            
        Returns:
            Producto: Updated product
            
        Raises:
            ValueError: If validation fails or product not found
        """
        producto = self.repo.update_stock(id, cantidad)
        if not producto:
            raise ValueError(f"Producto with id {id} not found")
        
        return producto
