"""
Direcciones Router - Address management endpoints
"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_direcciones():
    """List addresses - to be implemented"""
    return {"message": "List addresses - not yet implemented"}


@router.get("/{direccion_id}")
async def get_direccion(direccion_id: int):
    """Get address - to be implemented"""
    return {"message": f"Get address {direccion_id} - not yet implemented"}