"""
FastAPI Dependencies for authentication and authorization
"""
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from sqlmodel import Session

from app.core.database import get_session_context
from app.core.security import decode_access_token
from app.models.usuario import Usuario
from app.auth.repository import UsuarioRepository


# Security scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthCredentials = Depends(security),
    session: Session = Depends(get_session_context),
) -> Usuario:
    """
    Dependency to extract and validate JWT token, return authenticated user.
    
    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials
    
    # Decode token
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    usuario_repo = UsuarioRepository(session)
    usuario = usuario_repo.get_by_id(user_id)
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return usuario


async def require_role(
    *required_roles: str,
):
    """
    Factory to create a dependency that checks if user has required role(s).
    
    Usage:
        @router.get("/admin-only")
        async def admin_endpoint(
            current_user: Usuario = Depends(get_current_user),
            _: None = Depends(require_role("ADMIN"))
        ):
            ...
    """
    async def role_checker(
        current_user: Usuario = Depends(get_current_user),
    ):
        user_roles = [rol.rol.nombre for rol in current_user.roles]
        
        if not any(role in user_roles for role in required_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User does not have required roles: {', '.join(required_roles)}",
            )
        
        return current_user
    
    return role_checker


async def get_current_user_optional(
    credentials: Optional[HTTPAuthCredentials] = Depends(security),
    session: Session = Depends(get_session_context),
) -> Optional[Usuario]:
    """
    Optional dependency to get current user if authenticated,
    otherwise return None.
    """
    if not credentials:
        return None
    
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        return None
    
    user_id_str = payload.get("sub")
    if not user_id_str:
        return None
    
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        return None
    
    usuario_repo = UsuarioRepository(session)
    usuario = usuario_repo.get_by_id(user_id)
    
    return usuario
