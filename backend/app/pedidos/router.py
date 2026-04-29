"""
Pedidos Router - Order management endpoints
"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_pedidos():
    """List orders - to be implemented"""
    return {"message": "List orders - not yet implemented"}


@router.get("/{pedido_id}")
async def get_pedido(pedido_id: int):
    """Get order - to be implemented"""
    return {"message": f"Get order {pedido_id} - not yet implemented"}


@router.post("/")
async def crear_pedido():
    """Create order - to be implemented"""
    return {"message": "Create order - not yet implemented"}