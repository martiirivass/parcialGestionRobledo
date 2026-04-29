"""
Domain Models - Catálogo de Productos
"""
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.models.usuario import Usuario


class Categoria(SQLModel, table=True):
    """Categoria - Sistema jerárquico de categorías"""
    __tablename__ = "categorias"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=100, unique=True, nullable=False)
    descripcion: Optional[str] = Field(default=None, max_length=500)
    imagen: Optional[str] = Field(default=None, max_length=500)
    padre_id: Optional[int] = Field(default=None, foreign_key="categorias.id", nullable=True)
    
    # Audit fields
    creado_en: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    eliminado_en: Optional[datetime] = Field(default=None, nullable=True)
    
    # Self-referential relationship
    padre: Optional["Categoria"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[Categoria.padre_id]"}
    )
    hijos: list["Categoria"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[Categoria.padre_id]", "back_populates": "padre"}
    )


class Producto(SQLModel, table=True):
    """Producto - Entidad principal del catálogo"""
    __tablename__ = "productos"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=255, nullable=False)
    descripcion: Optional[str] = Field(default=None)
    imagen: Optional[str] = Field(default=None, max_length=500)
    precio: float = Field(nullable=False)  # NUMERIC in PostgreSQL
    stock_cantidad: int = Field(default=0, nullable=False)
    disponible: bool = Field(default=True, nullable=False)
    
    # Audit fields
    creado_en: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    eliminado_en: Optional[datetime] = Field(default=None, nullable=True)
    
    # Relationships
    categorias: list["ProductoCategoria"] = Relationship(
        back_populates="producto", 
        sa_relationship_kwargs={"lazy": "selectin"}
    )
    ingredientes: list["ProductoIngrediente"] = Relationship(
        back_populates="producto",
        sa_relationship_kwargs={"lazy": "selectin"}
    )
    detalles: list["DetallePedido"] = Relationship(
        back_populates="producto",
        sa_relationship_kwargs={"lazy": "selectin"}
    )


class Ingrediente(SQLModel, table=True):
    """Ingrediente - Componentes de los productos"""
    __tablename__ = "ingredientes"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=100, unique=True, nullable=False)
    descripcion: Optional[str] = Field(default=None, max_length=255)
    es_alergeno: bool = Field(default=False, nullable=False)
    
    # Relationships
    productos: list["ProductoIngrediente"] = Relationship(
        back_populates="ingrediente",
        sa_relationship_kwargs={"lazy": "selectin"}
    )


class ProductoCategoria(SQLModel, table=True):
    """ProductoCategoria - Relación muchos a muchos"""
    __tablename__ = "productos_categorias"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    producto_id: int = Field(foreign_key="productos.id", nullable=False)
    categoria_id: int = Field(foreign_key="categorias.id", nullable=False)
    
    # Relationships
    producto: Producto = Relationship(back_populates="categorias")
    categoria: Categoria = Relationship(back_populates="productos")


class ProductoIngrediente(SQLModel, table=True):
    """ProductoIngrediente - Relación muchos a muchos"""
    __tablename__ = "productos_ingredientes"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    producto_id: int = Field(foreign_key="productos.id", nullable=False)
    ingrediente_id: int = Field(foreign_key="ingredientes.id", nullable=False)
    
    # Relationships
    producto: Producto = Relationship(back_populates="ingredientes")
    ingrediente: Ingrediente = Relationship(back_populates="productos")


class FormaPago(SQLModel, table=True):
    """FormaPago - Catálogo de métodos de pago"""
    __tablename__ = "formas_pago"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=50, unique=True, nullable=False)
    activo: bool = Field(default=True, nullable=False)


if TYPE_CHECKING:
    from app.models.ventas import DetallePedido