"""
Productos Router - Product management endpoints
"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_productos():
    """List products - to be implemented"""
    return {"message": "List products - not yet implemented"}


@router.get("/{producto_id}")
async def get_producto(producto_id: int):
    """Get product - to be implemented"""
    return {"message": f"Get product {producto_id} - not yet implemented"}