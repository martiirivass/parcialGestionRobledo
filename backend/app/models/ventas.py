"""
Domain Models - Ventas, Pagos y Trazabilidad
"""
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.models.usuario import Usuario, DireccionEntrega
    from app.models.catalogo import Producto, FormaPago


class EstadoPedido(SQLModel, table=True):
    """EstadoPedido - Catálogo de estados del FSM"""
    __tablename__ = "estados_pedido"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=50, unique=True, nullable=False)
    descripcion: Optional[str] = Field(default=None, max_length=255)
    
    # Relationships
    pedidos: list["Pedido"] = Relationship(
        back_populates="estado",
        sa_relationship_kwargs={"lazy": "selectin"}
    )
    historial_anterior: list["HistorialEstadoPedido"] = Relationship(
        back_populates="estado_anterior",
        sa_relationship_kwargs={
            "foreign_keys": "[HistorialEstadoPedido.estado_anterior_id]",
            "lazy": "selectin"
        }
    )
    historial_nuevo: list["HistorialEstadoPedido"] = Relationship(
        back_populates="estado_nuevo",
        sa_relationship_kwargs={
            "foreign_keys": "[HistorialEstadoPedido.estado_nuevo_id]",
            "lazy": "selectin"
        }
    )


class Pedido(SQLModel, table=True):
    """Pedido - Entidad raíz del agregado"""
    __tablename__ = "pedidos"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuarios.id", nullable=False)
    estado_id: int = Field(foreign_key="estados_pedido.id", nullable=False)
    direccion_id: int = Field(foreign_key="direcciones_entrega.id", nullable=False)
    forma_pago_id: int = Field(foreign_key="formas_pago.id", nullable=False)
    
    # Snapshots (inmutable)
    direccion_snapshot: str = Field(nullable=False)  # JSON serialized
    costo_envio: float = Field(default=0, nullable=False)
    total: float = Field(nullable=False)
    
    # Audit fields
    creado_en: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    eliminado_en: Optional[datetime] = Field(default=None, nullable=True)
    
    # Relationships
    usuario: "Usuario" = Relationship(back_populates="pedidos")
    estado: "EstadoPedido" = Relationship(back_populates="pedidos")
    direccion: "DireccionEntrega" = Relationship(back_populates="pedidos")
    forma_pago: "FormaPago" = Relationship()
    detalles: list["DetallePedido"] = Relationship(
        back_populates="pedido",
        sa_relationship_kwargs={"lazy": "selectin"}
    )
    historial: list["HistorialEstadoPedido"] = Relationship(
        back_populates="pedido",
        sa_relationship_kwargs={"lazy": "selectin"}
    )
    pagos: list["Pago"] = Relationship(
        back_populates="pedido",
        sa_relationship_kwargs={"lazy": "selectin"}
    )


class DetallePedido(SQLModel, table=True):
    """DetallePedido - Línea dentro de un pedido"""
    __tablename__ = "detalles_pedido"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedidos.id", nullable=False)
    producto_id: int = Field(foreign_key="productos.id", nullable=False)
    
    cantidad: int = Field(nullable=False)
    precio_snapshot: float = Field(nullable=False)  # Price at order time
    subtotal: float = Field(nullable=False)
    personalizacion: Optional[str] = Field(default=None, nullable=True)  # JSON serialized customization

    
    # Relationships
    pedido: Pedido = Relationship(back_populates="detalles")
    producto: "Producto" = Relationship(back_populates="detalles")


class HistorialEstadoPedido(SQLModel, table=True):
    """HistorialEstadoPedido - Audit trail de transiciones"""
    __tablename__ = "historial_estados_pedido"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedidos.id", nullable=False)
    estado_anterior_id: Optional[int] = Field(default=None, foreign_key="estados_pedido.id", nullable=True)
    estado_nuevo_id: int = Field(foreign_key="estados_pedido.id", nullable=False)
    usuario_id: Optional[int] = Field(default=None, foreign_key="usuarios.id", nullable=True)
    observacion: Optional[str] = Field(default=None, max_length=500)
    creado_en: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    
    # Relationships
    pedido: Pedido = Relationship(back_populates="historial")
    estado_anterior: Optional["EstadoPedido"] = Relationship(
        back_populates="historial_anterior",
        sa_relationship_kwargs={"foreign_keys": "[HistorialEstadoPedido.estado_anterior_id]"}
    )
    estado_nuevo: "EstadoPedido" = Relationship(
        back_populates="historial_nuevo",
        sa_relationship_kwargs={"foreign_keys": "[HistorialEstadoPedido.estado_nuevo_id]"}
    )


class Pago(SQLModel, table=True):
    """Pago - Información de transacciones"""
    __tablename__ = "pagos"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedidos.id", nullable=False)
    monto: float = Field(nullable=False)
    mp_payment_id: Optional[str] = Field(default=None, max_length=50)
    mp_status: Optional[str] = Field(default=None, max_length=50)
    external_reference: Optional[str] = Field(default=None, max_length=100)
    idempotency_key: Optional[str] = Field(default=None, max_length=100)
    
    # Audit fields
    creado_en: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    
    # Relationships
    pedido: Pedido = Relationship(back_populates="pagos")