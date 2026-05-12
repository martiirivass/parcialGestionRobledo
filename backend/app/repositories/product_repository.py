"""
Product Repository - Data access layer for products
"""
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from sqlmodel import Session, select, text
from sqlalchemy import and_, or_, not_

from app.models.catalogo import Producto, Categoria, Ingrediente, ProductoCategoria, ProductoIngrediente
from app.repositories.base import BaseRepository


class ProductRepository(BaseRepository[Producto]):
    """Repository for Product model with advanced queries"""
    
    def __init__(self, session: Session):
        super().__init__(Producto, session)
    
    def get_all_public(
        self, 
        skip: int = 0, 
        limit: int = 100,
        categoria_id: Optional[int] = None,
        search: Optional[str] = None,
        excluir_alergenos: Optional[List[int]] = None
    ) -> List[Producto]:
        """
        Get all public products with filtering and pagination.
        
        Only returns available products (disponible=true, stock>0, not soft-deleted).
        Supports filtering by category, search by name, and allergen exclusion.
        
        Args:
            skip: Pagination offset
            limit: Pagination limit
            categoria_id: Optional category ID to filter by
            search: Optional text to search in product name
            excluir_alergenos: Optional list of allergen ingredient IDs to exclude
            
        Returns:
            List[Producto]: List of products matching criteria
        """
        query = select(Producto).where(
            and_(
                Producto.disponible == True,
                Producto.stock > 0,
                Producto.eliminado_en == None
            )
        )
        
        # Filter by category if provided
        if categoria_id is not None:
            query = query.join(ProductoCategoria).where(
                ProductoCategoria.categoria_id == categoria_id
            ).distinct()
        
        # Search by name if provided
        if search is not None:
            query = query.where(Producto.nombre.ilike(f"%{search}%"))
        
        # Exclude products with certain allergens if provided
        if excluir_alergenos:
            for allergen_id in excluir_alergenos:
                query = query.where(
                    ~Producto.ingredientes.any(
                        ProductoIngrediente.ingrediente_id == allergen_id
                    )
                )
        
        query = query.offset(skip).limit(limit)
        return list(self.session.exec(query).all())
    
    def count_public(
        self,
        categoria_id: Optional[int] = None,
        search: Optional[str] = None,
        excluir_alergenos: Optional[List[int]] = None
    ) -> int:
        """
        Count public products matching criteria.
        
        Args:
            categoria_id: Optional category ID to filter by
            search: Optional text to search in product name
            excluir_alergenos: Optional list of allergen ingredient IDs to exclude
            
        Returns:
            int: Count of matching products
        """
        query = select(Producto).where(
            and_(
                Producto.disponible == True,
                Producto.stock > 0,
                Producto.eliminado_en == None
            )
        )
        
        # Filter by category if provided
        if categoria_id is not None:
            query = query.join(ProductoCategoria).where(
                ProductoCategoria.categoria_id == categoria_id
            ).distinct()
        
        # Search by name if provided
        if search is not None:
            query = query.where(Producto.nombre.ilike(f"%{search}%"))
        
        # Exclude products with certain allergens if provided
        if excluir_alergenos:
            for allergen_id in excluir_alergenos:
                query = query.where(
                    ~Producto.ingredientes.any(
                        ProductoIngrediente.ingrediente_id == allergen_id
                    )
                )
        
        result = self.session.exec(query).all()
        return len(result)
    
    def get_by_id_public(self, id: int) -> Optional[Producto]:
        """
        Get a product by ID for public consumption.
        
        Only returns if product is available (disponible=true, stock>0, not soft-deleted).
        Loads relationships (categorias, ingredientes).
        
        Args:
            id: Product ID
            
        Returns:
            Producto: Product if found and public, None otherwise
        """
        query = select(Producto).where(
            and_(
                Producto.id == id,
                Producto.disponible == True,
                Producto.stock > 0,
                Producto.eliminado_en == None
            )
        )
        return self.session.exec(query).first()
    
    def get_by_id_admin(self, id: int, include_deleted: bool = False) -> Optional[Producto]:
        """
        Get a product by ID for admin consumption.
        
        Can include soft-deleted products if flag is set.
        Loads relationships (categorias, ingredientes).
        
        Args:
            id: Product ID
            include_deleted: Whether to include soft-deleted products
            
        Returns:
            Producto: Product if found, None otherwise
        """
        query = select(Producto).where(Producto.id == id)
        
        if not include_deleted:
            query = query.where(Producto.eliminado_en == None)
        
        return self.session.exec(query).first()
    
    def create_with_associations(
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
        Create a product with category and ingredient associations atomically.
        
        Args:
            nombre: Product name
            descripcion: Product description
            precio: Product price (Decimal)
            stock: Initial stock quantity
            imagen_url: Product image URL
            disponible: Availability flag
            categorias_ids: List of category IDs to associate
            ingredientes_ids: List of ingredient IDs to associate
            
        Returns:
            Producto: Created product
            
        Raises:
            ValueError: If any category or ingredient ID doesn't exist
        """
        now = datetime.utcnow()
        
        # Create product
        producto = Producto(
            nombre=nombre,
            descripcion=descripcion,
            precio=precio,
            stock=stock,
            imagen_url=imagen_url,
            disponible=disponible,
            creado_en=now,
            actualizado_en=now
        )
        
        self.session.add(producto)
        self.session.flush()
        
        # Add category associations
        if categorias_ids:
            for categoria_id in categorias_ids:
                # Verify category exists
                categoria = self.session.exec(
                    select(Categoria).where(Categoria.id == categoria_id)
                ).first()
                if not categoria:
                    raise ValueError(f"Categoria with id {categoria_id} not found")
                
                pc = ProductoCategoria(
                    producto_id=producto.id,
                    categoria_id=categoria_id
                )
                self.session.add(pc)
        
        # Add ingredient associations
        if ingredientes_ids:
            for ingrediente_id in ingredientes_ids:
                # Verify ingredient exists
                ingrediente = self.session.exec(
                    select(Ingrediente).where(Ingrediente.id == ingrediente_id)
                ).first()
                if not ingrediente:
                    raise ValueError(f"Ingrediente with id {ingrediente_id} not found")
                
                pi = ProductoIngrediente(
                    producto_id=producto.id,
                    ingrediente_id=ingrediente_id
                )
                self.session.add(pi)
        
        self.session.flush()
        self.session.refresh(producto)
        return producto
    
    def update_with_associations(
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
    ) -> Optional[Producto]:
        """
        Update a product with category and ingredient associations atomically.
        
        Args:
            id: Product ID
            nombre: New name (optional)
            descripcion: New description (optional)
            precio: New price (optional)
            stock: New stock (optional)
            imagen_url: New image URL (optional)
            disponible: New availability (optional)
            categorias_ids: New category IDs (optional; replaces all)
            ingredientes_ids: New ingredient IDs (optional; replaces all)
            
        Returns:
            Producto: Updated product, or None if not found
            
        Raises:
            ValueError: If any category or ingredient ID doesn't exist
        """
        producto = self.get_by_id_admin(id, include_deleted=True)
        if not producto:
            return None
        
        # Update fields
        if nombre is not None:
            producto.nombre = nombre
        if descripcion is not None:
            producto.descripcion = descripcion
        if precio is not None:
            producto.precio = precio
        if stock is not None:
            producto.stock = stock
        if imagen_url is not None:
            producto.imagen_url = imagen_url
        if disponible is not None:
            producto.disponible = disponible
        
        producto.actualizado_en = datetime.utcnow()
        
        # Update categories if provided
        if categorias_ids is not None:
            # Remove existing associations
            existing_assocs = self.session.exec(
                select(ProductoCategoria).where(ProductoCategoria.producto_id == id)
            ).all()
            for assoc in existing_assocs:
                self.session.delete(assoc)
            
            # Add new associations
            for categoria_id in categorias_ids:
                # Verify category exists
                categoria = self.session.exec(
                    select(Categoria).where(Categoria.id == categoria_id)
                ).first()
                if not categoria:
                    raise ValueError(f"Categoria with id {categoria_id} not found")
                
                pc = ProductoCategoria(
                    producto_id=id,
                    categoria_id=categoria_id
                )
                self.session.add(pc)
        
        # Update ingredients if provided
        if ingredientes_ids is not None:
            # Remove existing associations
            existing_assocs = self.session.exec(
                select(ProductoIngrediente).where(ProductoIngrediente.producto_id == id)
            ).all()
            for assoc in existing_assocs:
                self.session.delete(assoc)
            
            # Add new associations
            for ingrediente_id in ingredientes_ids:
                # Verify ingredient exists
                ingrediente = self.session.exec(
                    select(Ingrediente).where(Ingrediente.id == ingrediente_id)
                ).first()
                if not ingrediente:
                    raise ValueError(f"Ingrediente with id {ingrediente_id} not found")
                
                pi = ProductoIngrediente(
                    producto_id=id,
                    ingrediente_id=ingrediente_id
                )
                self.session.add(pi)
        
        self.session.flush()
        self.session.refresh(producto)
        return producto
    
    def update_stock(self, id: int, cantidad: int) -> Optional[Producto]:
        """
        Update product stock atomically using SELECT FOR UPDATE to prevent race conditions.
        
        Args:
            id: Product ID
            cantidad: Quantity to change (positive to increase, negative to decrease)
            
        Returns:
            Producto: Updated product, or None if not found
            
        Raises:
            ValueError: If resulting stock would be negative
        """
        # Use raw SQL SELECT FOR UPDATE for pessimistic locking
        query_text = "SELECT * FROM productos WHERE id = :id FOR UPDATE"
        result = self.session.exec(text(query_text), {"id": id}).first()
        
        if not result:
            return None
        
        # Get the actual product object
        producto = self.get_by_id_admin(id, include_deleted=True)
        if not producto:
            return None
        
        new_stock = producto.stock + cantidad
        if new_stock < 0:
            raise ValueError(f"Stock cannot be negative. Current: {producto.stock}, Change: {cantidad}")
        
        producto.stock = new_stock
        producto.actualizado_en = datetime.utcnow()
        
        self.session.flush()
        self.session.refresh(producto)
        return producto
    
    def soft_delete_product(self, id: int) -> Optional[Producto]:
        """
        Soft delete a product by setting eliminado_en timestamp.
        
        Args:
            id: Product ID
            
        Returns:
            Producto: Soft-deleted product, or None if not found
        """
        producto = self.get_by_id_admin(id, include_deleted=True)
        if not producto:
            return None
        
        producto.eliminado_en = datetime.utcnow()
        self.session.flush()
        self.session.refresh(producto)
        return producto
