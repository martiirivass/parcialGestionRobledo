"""
Categorias Router - Category management endpoints
"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_categorias():
    """List categories - to be implemented"""
    return {"message": "List categories - not yet implemented"}


@router.get("/{categoria_id}")
async def get_categoria(categoria_id: int):
    """Get category - to be implemented"""
    return {"message": f"Get category {categoria_id} - not yet implemented"}