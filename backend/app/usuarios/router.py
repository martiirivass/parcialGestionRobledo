"""
Usuarios Router - User management endpoints
"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_usuarios():
    """List users - to be implemented"""
    return {"message": "List users - not yet implemented"}


@router.get("/{user_id}")
async def get_usuario(user_id: int):
    """Get user - to be implemented"""
    return {"message": f"Get user {user_id} - not yet implemented"}