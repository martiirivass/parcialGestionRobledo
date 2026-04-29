"""
Domain Models - Identidad y Acceso
"""
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

# Audit fields mixin
class AuditFieldsMixin(SQLModel):
    """Mixin for audit fields"""
    creado_en: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    eliminado_en: Optional[datetime] = Field(default=None, nullable=True)


# Domain 1: Identidad y Acceso

class Usuario(SQLModel, table=True):
    """Usuario - Entidad principal de autenticación"""
    __tablename__ = "usuarios"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=255, nullable=False)
    email: str = Field(max_length=255, unique=True, index=True, nullable=False)
    password_hash: str = Field(max_length=255, nullable=False)
    telefono: Optional[str] = Field(default=None, max_length=20)
    
    # Audit fields
    creado_en: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    eliminado_en: Optional[datetime] = Field(default=None, nullable=True)
    
    # Relationships
    roles: list["UsuarioRol"] = Relationship(back_populates="usuario", sa_relationship_kwargs={"lazy": "selectin"})
    direcciones: list["DireccionEntrega"] = Relationship(back_populates="usuario", sa_relationship_kwargs={"lazy": "selectin"})
    refresh_tokens: list["RefreshToken"] = Relationship(back_populates="usuario", sa_relationship_kwargs={"lazy": "selectin"})
    pedidos: list["Pedido"] = Relationship(back_populates="usuario", sa_relationship_kwargs={"lazy": "selectin"})


class Rol(SQLModel, table=True):
    """Rol - Catálogo de roles"""
    __tablename__ = "roles"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=50, unique=True, nullable=False)
    descripcion: Optional[str] = Field(default=None, max_length=255)
    
    # Relationships
    usuarios: list["UsuarioRol"] = Relationship(back_populates="rol", sa_relationship_kwargs={"lazy": "selectin"})


class UsuarioRol(SQLModel, table=True):
    """UsuarioRol - Relación muchos a muchos entre usuarios y roles"""
    __tablename__ = "usuarios_roles"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuarios.id", nullable=False)
    rol_id: int = Field(foreign_key="roles.id", nullable=False)
    
    # Relationships
    usuario: Usuario = Relationship(back_populates="roles")
    rol: Rol = Relationship(back_populates="usuarios")
    
    # Unique constraint is defined in table args below
    class Config:
        table_args = ({"sqlite_unique_constraint": ["usuario_id", "rol_id"]},)


class RefreshToken(SQLModel, table=True):
    """RefreshToken - Tokens de renovación"""
    __tablename__ = "refresh_tokens"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    token: str = Field(max_length=36, unique=True, index=True, nullable=False)
    usuario_id: int = Field(foreign_key="usuarios.id", nullable=False)
    expira_en: datetime = Field(nullable=False)
    revocado_en: Optional[datetime] = Field(default=None, nullable=True)
    
    # Relationships
    usuario: Usuario = Relationship(back_populates="refresh_tokens")


class DireccionEntrega(SQLModel, table=True):
    """DireccionEntrega - Direcciones de entrega del cliente"""
    __tablename__ = "direcciones_entrega"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuarios.id", nullable=False)
    calle: str = Field(max_length=255, nullable=False)
    numero: str = Field(max_length=20, nullable=False)
    piso_depto: Optional[str] = Field(default=None, max_length=50)
    ciudad: str = Field(max_length=100, nullable=False)
    cp: str = Field(max_length=10, nullable=False)
    referencia: Optional[str] = Field(default=None, max_length=255)
    es_predeterminada: bool = Field(default=False, nullable=False)
    
    # Audit fields
    creado_en: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    eliminado_en: Optional[datetime] = Field(default=None, nullable=True)
    
    # Relationships
    usuario: Usuario = Relationship(back_populates="direcciones")
    pedidos: list["Pedido"] = Relationship(back_populates="direccion", sa_relationship_kwargs={"lazy": "selectin"})


if TYPE_CHECKING:
    from app.models.catalogo import (
        Categoria, Producto, Ingrediente, 
        ProductoCategoria, ProductoIngrediente, FormaPago
    )
    from app.models.ventas import (
        EstadoPedido, Pedido, DetallePedido, 
        HistorialEstadoPedido, Pago
    )