"""
Models package - All domain models
"""
from app.models.usuario import (
    Usuario,
    Rol,
    UsuarioRol,
    RefreshToken,
    DireccionEntrega,
)
from app.models.catalogo import (
    Categoria,
    Producto,
    Ingrediente,
    ProductoCategoria,
    ProductoIngrediente,
    FormaPago,
)
from app.models.ventas import (
    EstadoPedido,
    Pedido,
    DetallePedido,
    HistorialEstadoPedido,
    Pago,
)

__all__ = [
    # Domain 1 - Identidad
    "Usuario",
    "Rol", 
    "UsuarioRol",
    "RefreshToken",
    "DireccionEntrega",
    # Domain 2 - Catálogo
    "Categoria",
    "Producto",
    "Ingrediente",
    "ProductoCategoria",
    "ProductoIngrediente",
    "FormaPago",
    # Domain 3 - Ventas
    "EstadoPedido",
    "Pedido",
    "DetallePedido",
    "HistorialEstadoPedido",
    "Pago",
]