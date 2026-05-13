"""
Schemas Pydantic para pedidos
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# === Request Schemas ===

class ItemPedidoRequest(BaseModel):
    """Item individual en la creación de un pedido"""
    producto_id: int = Field(..., gt=0, description="ID del producto")
    cantidad: int = Field(..., gt=0, description="Cantidad solicitada")
    personalizacion: Optional[List[int]] = Field(
        default=None, 
        description="IDs de ingredientes a remover"
    )


class CrearPedidoRequest(BaseModel):
    """Request para crear un nuevo pedido"""
    items: List[ItemPedidoRequest] = Field(
        ..., 
        min_length=1,
        description="Lista de items del pedido"
    )
    forma_pago_codigo: str = Field(
        ..., 
        description="Código de forma de pago (ej: 'tarjeta_credito')"
    )
    direccion_id: Optional[int] = Field(
        default=None, 
        description="ID de dirección de entrega (None para retiro en local)"
    )
    notas: Optional[str] = Field(
        default=None, 
        max_length=500,
        description="Notas adicionales del pedido"
    )


class CambiarEstadoRequest(BaseModel):
    """Request para cambiar el estado de un pedido"""
    nuevo_estado: str = Field(..., description="Nuevo código de estado")
    observacion: Optional[str] = Field(
        default=None, 
        max_length=500,
        description="Observación opcional del cambio"
    )


# === Response Schemas ===

class DetallePedidoRead(BaseModel):
    """Detalle de un pedido (línea individual)"""
    id: int
    producto_id: int
    cantidad: int
    precio_snapshot: float
    subtotal: float
    personalizacion: Optional[str] = None  # JSON serialized
    
    class Config:
        from_attributes = True


class HistorialRead(BaseModel):
    """Registro del historial de estados"""
    id: int
    pedido_id: int
    estado_anterior_nombre: Optional[str] = None
    estado_nuevo_nombre: str
    usuario_nombre: Optional[str] = None
    observacion: Optional[str] = None
    creado_en: datetime
    
    class Config:
        from_attributes = True


class PedidoRead(BaseModel):
    """Pedido resumido para listados"""
    id: int
    usuario_id: int
    estado_nombre: str
    total: float
    created_at: datetime
    
    class Config:
        from_attributes = True


class PedidoDetail(PedidoRead):
    """Pedido completo con todos los detalles"""
    direccion_snapshot: Optional[str] = None
    costo_envio: float
    forma_pago_nombre: Optional[str] = None
    notas: Optional[str] = None
    items: List[DetallePedidoRead] = []
    historial: List[HistorialRead] = []
    
    class Config:
        from_attributes = True


# === Pagination ===

class PaginatedPedidosResponse(BaseModel):
    """Respuesta paginada de pedidos"""
    items: List[PedidoRead]
    total: int
    skip: int
    limit: int


class PaginatedHistorialResponse(BaseModel):
    """Respuesta paginada de historial"""
    items: List[HistorialRead]
    total: int