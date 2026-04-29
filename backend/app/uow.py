"""
Unit of Work - Transaction management
"""
from contextlib import contextmanager
from typing import Any, Generator
from sqlmodel import Session

from app.core.database import engine
from app.repositories.base import BaseRepository


class UnitOfWork:
    """Unit of Work as context manager"""
    
    def __init__(self):
        self.session: Session = None
        # Repository attributes will be set dynamically
        self.usuarios = None
        self.roles = None
        self.categorias = None
        self.productos = None
        self.pedidos = None
        self.pagos = None
        self.direcciones = None
        self.ingredientes = None
        self.estados_pedido = None
        self.formas_pago = None
    
    def __enter__(self) -> "UnitOfWork":
        self.session = Session(engine)
        # Initialize repositories with session and respective models
        from app.models.usuario import Usuario, Rol, UsuarioRol, RefreshToken, DireccionEntrega
        from app.models.catalogo import Categoria, Producto, Ingrediente, FormaPago
        from app.models.ventas import EstadoPedido, Pedido, DetallePedido, HistorialEstadoPedido, Pago
        
        self.usuarios = BaseRepository(Usuario, self.session)
        self.roles = BaseRepository(Rol, self.session)
        self.usuarios_roles = BaseRepository(UsuarioRol, self.session)
        self.refresh_tokens = BaseRepository(RefreshToken, self.session)
        self.direcciones = BaseRepository(DireccionEntrega, self.session)
        self.categorias = BaseRepository(Categoria, self.session)
        self.productos = BaseRepository(Producto, self.session)
        self.ingredientes = BaseRepository(Ingrediente, self.session)
        self.estados_pedido = BaseRepository(EstadoPedido, self.session)
        self.pedidos = BaseRepository(Pedido, self.session)
        self.detalles_pedido = BaseRepository(DetallePedido, self.session)
        self.historial_estados = BaseRepository(HistorialEstadoPedido, self.session)
        self.pagos = BaseRepository(Pago, self.session)
        self.formas_pago = BaseRepository(FormaPago, self.session)
        
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            # Rollback on exception
            self.session.rollback()
            return False
        else:
            # Commit on success
            self.session.commit()
            return True
    
    def commit(self):
        """Manually commit the transaction"""
        self.session.commit()
    
    def rollback(self):
        """Manually rollback the transaction"""
        self.session.rollback()


@contextmanager
def get_uow() -> Generator[UnitOfWork, None, None]:
    """Context manager for Unit of Work"""
    with UnitOfWork() as uow:
        try:
            yield uow
        except Exception:
            uow.rollback()
            raise