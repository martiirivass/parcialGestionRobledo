"""
Pagos Router - Payment endpoints
"""
from fastapi import APIRouter

router = APIRouter()


@router.post("/crear-preferencia")
async def crear_preferencia():
    """Create payment preference - to be implemented"""
    return {"message": "Create payment preference - not yet implemented"}


@router.post("/webhook")
async def webhook():
    """Payment webhook - to be implemented"""
    return {"message": "Payment webhook - not yet implemented"}