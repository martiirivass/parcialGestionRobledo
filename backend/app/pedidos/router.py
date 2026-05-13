"""
Pedidos Router - Order management endpoints
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session

from app.core.database import get_session_context
from app.core.dependencies import get_current_user, require_role
from app.models.usuario import Usuario
from app.pedidos import schemas
from app.pedidos.service import PedidoService
from app.uow import UnitOfWork


router = APIRouter()


def get_pedido_service(session: Session = Depends(get_session_context)) -> PedidoService:
    """Dependency para obtener el servicio de pedidos"""
    with UnitOfWork() as uow:
        yield PedidoService(uow)


def get_user_roles(user: Usuario) -> List[str]:
    """Obtiene los roles del usuario"""
    return [rol.rol.nombre for rol in user.roles]


# ========== Endpoints ==========

@router.get("", response_model=schemas.PaginatedPedidosResponse)
async def listar_pedidos(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: Usuario = Depends(get_current_user),
    service: PedidoService = Depends(get_pedido_service),
):
    """
    Lista los pedidos del usuario autenticado.
    - CLIENT: solo ve sus propios pedidos
    - ADMIN/PEDIDOS: ve todos los pedidos
    """
    roles = get_user_roles(current_user)
    es_admin_o_pedidos = "ADMIN" in roles or "PEDIDOS" in roles
    
    # Si es cliente, solo mostrar sus pedidos
    usuario_id = None if es_admin_o_pedidos else current_user.id
    
    pedidos, total = service.listar_pedidos(
        usuario_id=usuario_id,
        skip=skip,
        limit=limit,
    )
    
    # Mapear a response - cargar estado para cada pedido
    items = []
    for pedido in pedidos:
        # Cargar el estado relacionado
        service.uow.session.refresh(pedido, ["estado"])
        items.append(schemas.PedidoRead(
            id=pedido.id,
            usuario_id=pedido.usuario_id,
            estado_nombre=pedido.estado.nombre if hasattr(pedido, 'estado') else "PENDIENTE",
            total=pedido.total,
            created_at=pedido.creado_en,
        ))
    
    return schemas.PaginatedPedidosResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/{pedido_id}", response_model=schemas.PedidoDetail)
async def obtener_pedido(
    pedido_id: int,
    current_user: Usuario = Depends(get_current_user),
    service: PedidoService = Depends(get_pedido_service),
):
    """Obtiene el detalle de un pedido específico"""
    roles = get_user_roles(current_user)
    
    try:
        result = service.obtener_pedido_detail(pedido_id, current_user.id, roles)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    
    pedido = result["pedido"]
    detalles = result["detalles"]
    historial = result["historial"]
    
    # Mapear detalles
    items = [
        schemas.DetallePedidoRead(
            id=d.id,
            producto_id=d.producto_id,
            cantidad=d.cantidad,
            precio_snapshot=d.precio_snapshot,
            subtotal=d.subtotal,
            personalizacion=d.personalizacion,
        )
        for d in detalles
    ]
    
    # Mapear historial
    historial_list = []
    for h in historial:
        historial_list.append(schemas.HistorialRead(
            id=h.id,
            pedido_id=h.pedido_id,
            estado_anterior_nombre=h.estado_anterior.nombre if h.estado_anterior else None,
            estado_nuevo_nombre=h.estado_nuevo.nombre,
            observacion=h.observacion,
            creado_en=h.creado_en,
        ))
    
    return schemas.PedidoDetail(
        id=pedido.id,
        usuario_id=pedido.usuario_id,
        estado_nombre=pedido.estado.nombre,
        direccion_snapshot=pedido.direccion_snapshot,
        costo_envio=pedido.costo_envio,
        total=pedido.total,
        forma_pago_nombre=pedido.forma_pago.nombre if pedido.forma_pago else None,
        notas=pedido.notas,
        created_at=pedido.creado_en,
        items=items,
        historial=historial_list,
    )


@router.post("", response_model=schemas.PedidoRead, status_code=status.HTTP_201_CREATED)
async def crear_pedido(
    pedido_data: schemas.CrearPedidoRequest,
    current_user: Usuario = Depends(get_current_user),
    service: PedidoService = Depends(get_pedido_service),
):
    """
    Crea un nuevo pedido desde el carrito.
    Solo accesible para clientes autenticados.
    """
    try:
        pedido, detalles = service.crear_pedido(
            usuario_id=current_user.id,
            items=pedido_data.items,
            forma_pago_codigo=pedido_data.forma_pago_codigo,
            direccion_id=pedido_data.direccion_id,
            notas=pedido_data.notas,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    
    return schemas.PedidoRead(
        id=pedido.id,
        usuario_id=pedido.usuario_id,
        estado_nombre="PENDIENTE",
        total=pedido.total,
        created_at=pedido.creado_en,
    )


@router.patch("/{pedido_id}/estado", response_model=schemas.PedidoRead)
async def cambiar_estado(
    pedido_id: int,
    estado_data: schemas.CambiarEstadoRequest,
    current_user: Usuario = Depends(get_current_user),
    service: PedidoService = Depends(get_pedido_service),
):
    """
    Cambia el estado de un pedido.
    Requiere rol ADMIN o PEDIDOS.
    Valida la FSM (transiciones permitidas).
    """
    roles = get_user_roles(current_user)
    
    # Verificar que tiene rol para cambiar estados
    if "ADMIN" not in roles and "PEDIDOS" not in roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo ADMIN o PEDIDOS pueden cambiar el estado de un pedido",
        )
    
    try:
        pedido = service.cambiar_estado(
            pedido_id=pedido_id,
            nuevo_estado=estado_data.nuevo_estado,
            usuario_id=current_user.id,
            roles=roles,
            observacion=estado_data.observacion,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    
    # Refresh para obtener el estado actualizado
    service.uow.session.refresh(pedido, ["estado"])
    estado_nombre = pedido.estado.nombre if hasattr(pedido, 'estado') else estado_data.nuevo_estado
    
    return schemas.PedidoRead(
        id=pedido.id,
        usuario_id=pedido.usuario_id,
        estado_nombre=estado_nombre,
        total=pedido.total,
        created_at=pedido.creado_en,
    )


@router.get("/{pedido_id}/historial", response_model=schemas.PaginatedHistorialResponse)
async def obtener_historial(
    pedido_id: int,
    current_user: Usuario = Depends(get_current_user),
    service: PedidoService = Depends(get_pedido_service),
):
    """Obtiene el historial de estados de un pedido"""
    roles = get_user_roles(current_user)
    
    try:
        historial = service.obtener_historial(pedido_id, current_user.id, roles)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    
    historial_list = []
    for h in historial:
        historial_list.append(schemas.HistorialRead(
            id=h.id,
            pedido_id=h.pedido_id,
            estado_anterior_nombre=h.estado_anterior.nombre if h.estado_anterior else None,
            estado_nuevo_nombre=h.estado_nuevo.nombre,
            observacion=h.observacion,
            creado_en=h.creado_en,
        ))
    
    return schemas.PaginatedHistorialResponse(
        items=historial_list,
        total=len(historial_list),
    )


@router.delete("/{pedido_id}", response_model=schemas.PedidoRead)
async def cancelar_pedido(
    pedido_id: int,
    current_user: Usuario = Depends(get_current_user),
    service: PedidoService = Depends(get_pedido_service),
):
    """
    Cancela un pedido propio.
    Solo permitido desde estados PENDIENTE o CONFIRMADO.
    """
    try:
        pedido = service.cancelar_pedido(
            pedido_id=pedido_id,
            usuario_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    
    return schemas.PedidoRead(
        id=pedido.id,
        usuario_id=pedido.usuario_id,
        estado_nombre="CANCELADO",
        total=pedido.total,
        created_at=pedido.creado_en,
    )